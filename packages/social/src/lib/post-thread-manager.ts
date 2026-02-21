// Post threading: create linked chains for Twitter threads and Instagram carousels
// Scoped to platforms with native thread support only

import { prisma } from '@creator-studio/db/client'
import { getPlatformClient } from './platform-factory'
import type { SocialPlatform, ThreadParams } from '../types/social-types'

function generateGroupId(): string {
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const THREAD_PLATFORMS = new Set<SocialPlatform>(['twitter', 'instagram'])

export async function createThreadPosts(params: ThreadParams): Promise<string[]> {
  if (!THREAD_PLATFORMS.has(params.platform)) {
    throw new Error(`Threading not supported for ${params.platform}. Use single post instead.`)
  }

  if (params.posts.length === 0) {
    throw new Error('Thread must contain at least one post')
  }

  const postGroupId = generateGroupId()
  const postIds: string[] = []

  // Create first post (parent)
  const parent = await prisma.socialPost.create({
    data: {
      content: params.posts[0].content,
      mediaUrls: params.posts[0].mediaUrls,
      platform: params.platform,
      status: params.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: params.scheduledAt,
      socialAccountId: params.socialAccountId,
      postGroupId,
    },
  })
  postIds.push(parent.id)

  // Create child posts linked to parent
  for (let i = 1; i < params.posts.length; i++) {
    const child = await prisma.socialPost.create({
      data: {
        content: params.posts[i].content,
        mediaUrls: params.posts[i].mediaUrls,
        platform: params.platform,
        status: params.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: params.scheduledAt,
        socialAccountId: params.socialAccountId,
        parentPostId: parent.id,
        postGroupId,
      },
    })
    postIds.push(child.id)
  }

  return postIds
}

export async function getThreadPosts(parentPostId: string) {
  const parent = await prisma.socialPost.findUnique({
    where: { id: parentPostId },
    include: { socialAccount: true },
  })

  if (!parent) throw new Error(`Parent post not found: ${parentPostId}`)

  const children = await prisma.socialPost.findMany({
    where: { parentPostId },
    orderBy: { createdAt: 'asc' },
    include: { socialAccount: true },
  })

  return [parent, ...children]
}

export async function publishThread(parentPostId: string): Promise<string[]> {
  const posts = await getThreadPosts(parentPostId)
  if (posts.length === 0) throw new Error('No posts in thread')

  const firstPost = posts[0]
  const metadata = firstPost.socialAccount.metadata as Record<string, string> | null
  const client = getPlatformClient(
    firstPost.platform as SocialPlatform,
    firstPost.socialAccount.accessToken,
    metadata ? {
      handle: metadata.handle,
      appPassword: metadata.appPassword,
      clientKey: metadata.clientKey,
      clientSecret: metadata.clientSecret,
      refreshToken: metadata.refreshToken,
    } : undefined
  )

  // If client supports native threading, use it
  if (client.postThread) {
    const postParams = posts.map((p) => ({
      userId: p.socialAccount.platformUserId,
      content: p.content,
      mediaUrls: p.mediaUrls,
    }))

    const results = await client.postThread(postParams)

    // Update all posts with platform IDs
    const platformIds: string[] = []
    for (let i = 0; i < posts.length; i++) {
      const result = results[i]
      if (result) {
        await prisma.socialPost.update({
          where: { id: posts[i].id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            platformPostId: result.id,
          },
        })
        platformIds.push(result.id)
      }
    }

    return platformIds
  }

  // Fallback: publish sequentially (for platforms without postThread)
  const platformIds: string[] = []
  for (const post of posts) {
    const response = await client.post({
      userId: post.socialAccount.platformUserId,
      content: post.content,
      mediaUrls: post.mediaUrls,
    })

    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: response.id,
      },
    })
    platformIds.push(response.id)
  }

  return platformIds
}
