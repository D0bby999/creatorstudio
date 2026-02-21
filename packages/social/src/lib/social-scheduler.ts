// Social media post scheduler using Inngest
// Multi-platform publishing with health checks and retry tracking

import { prisma } from '@creator-studio/db/client'
import { getPlatformClient } from './platform-factory'
import { PlatformHealthTracker } from './platform-health-tracker'
import { createSafeErrorMessage } from './error-sanitizer'
import { adaptContent } from './content-adapter'
import type { SocialPlatform, ScheduledPostJob } from '../types/social-types'

export async function sendScheduledPostEvent(postId: string, scheduledAt: Date): Promise<void> {
  if (!process.env.INNGEST_EVENT_KEY) {
    console.warn('INNGEST_EVENT_KEY not set, scheduled posts will not auto-publish')
    return
  }

  try {
    const response = await fetch('https://inn.gs/e/creator-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INNGEST_EVENT_KEY}`,
      },
      body: JSON.stringify({
        name: 'social/post.scheduled',
        data: { postId, scheduledAt: scheduledAt.toISOString() },
      }),
    })

    if (!response.ok) {
      throw new Error(`Inngest API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to send Inngest event:', error)
  }
}

export async function getDuePosts(): Promise<ScheduledPostJob[]> {
  const posts = await prisma.socialPost.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: new Date() },
    },
    select: {
      id: true,
      socialAccountId: true,
      scheduledAt: true,
    },
    orderBy: { scheduledAt: 'asc' },
  })

  return posts.map((post) => ({
    postId: post.id,
    socialAccountId: post.socialAccountId,
    scheduledAt: post.scheduledAt!,
  }))
}

// Extract platform-specific params from socialAccount metadata
function extractPlatformParams(metadata: Record<string, string> | null) {
  if (!metadata) return {}
  return {
    handle: metadata.handle,
    appPassword: metadata.appPassword,
    pageId: metadata.pageId,
    pageAccessToken: metadata.pageAccessToken,
    openId: metadata.openId,
    userId: metadata.userId,
    appId: metadata.appId,
    appSecret: metadata.appSecret,
    clientKey: metadata.clientKey,
    clientSecret: metadata.clientSecret,
    refreshToken: metadata.refreshToken,
  }
}

async function markForRetry(postId: string, reason: string): Promise<void> {
  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      retryCount: { increment: 1 },
      failureReason: reason,
    },
  })
}

export async function publishPost(postId: string): Promise<void> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { socialAccount: true },
  })

  if (!post) throw new Error(`Post not found: ${postId}`)
  if (post.status !== 'scheduled') {
    throw new Error(`Post is not scheduled: ${postId} (status: ${post.status})`)
  }

  // Health check before publish
  const health = PlatformHealthTracker.getInstance().getMetrics(post.platform)
  if (health.status === 'unhealthy') {
    await markForRetry(postId, `Platform unhealthy: ${post.platform}`)
    return
  }

  try {
    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: 'publishing' },
    })

    const metadata = post.socialAccount.metadata as Record<string, string> | null
    const client = getPlatformClient(
      post.platform as SocialPlatform,
      post.socialAccount.accessToken,
      extractPlatformParams(metadata)
    )

    const response = await client.post({
      userId: post.socialAccount.platformUserId,
      content: post.content,
      mediaUrls: post.mediaUrls,
    })

    await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: response.id,
      },
    })
  } catch (error) {
    const safeMessage = createSafeErrorMessage('Publish failed', error)
    await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'failed',
        failureReason: safeMessage,
        retryCount: { increment: 1 },
      },
    })
    throw error
  }
}

export async function schedulePost(params: {
  content: string
  mediaUrls: string[]
  scheduledAt: Date
  socialAccountId: string
  postGroupId?: string
}): Promise<string> {
  const { content, mediaUrls, scheduledAt, socialAccountId, postGroupId } = params

  if (scheduledAt <= new Date()) {
    throw new Error('Scheduled time must be in the future')
  }

  const socialAccount = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  })

  if (!socialAccount) {
    throw new Error(`Social account not found: ${socialAccountId}`)
  }

  const post = await prisma.socialPost.create({
    data: {
      content,
      mediaUrls,
      platform: socialAccount.platform,
      scheduledAt,
      status: 'scheduled',
      socialAccountId,
      ...(postGroupId && { postGroupId }),
    },
  })

  await sendScheduledPostEvent(post.id, scheduledAt).catch((error) => {
    console.error('Failed to schedule via Inngest:', error)
  })

  return post.id
}

export async function cancelScheduledPost(postId: string): Promise<void> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
  })

  if (!post) throw new Error(`Post not found: ${postId}`)
  if (post.status !== 'scheduled') {
    throw new Error(`Cannot cancel post with status: ${post.status}`)
  }

  await prisma.socialPost.update({
    where: { id: postId },
    data: { status: 'draft' },
  })
}

export async function scheduleBatchPost(params: {
  content: string
  mediaUrls: string[]
  platforms: Array<{ socialAccountId: string }>
  scheduledAt: Date
}): Promise<string[]> {
  const postGroupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const postIds = await Promise.all(
    params.platforms.map(async (p) => {
      const account = await prisma.socialAccount.findUniqueOrThrow({
        where: { id: p.socialAccountId },
      })
      const adapted = adaptContent(params.content, account.platform as SocialPlatform)

      return schedulePost({
        content: adapted.content,
        mediaUrls: params.mediaUrls,
        scheduledAt: params.scheduledAt,
        socialAccountId: p.socialAccountId,
        postGroupId,
      })
    })
  )

  return postIds
}

export const inngestSchedulerConfig = {
  id: 'social-post-scheduler',
  name: 'Publish Scheduled Social Posts',
  cron: '* * * * *',
  handler: async () => {
    const duePosts = await getDuePosts()

    const results = await Promise.allSettled(
      duePosts.map((job) => publishPost(job.postId))
    )

    const failures = results.filter((r) => r.status === 'rejected')
    if (failures.length > 0) {
      console.error(`${failures.length} posts failed to publish`)
    }

    return {
      processed: duePosts.length,
      succeeded: results.filter((r) => r.status === 'fulfilled').length,
      failed: failures.length,
    }
  },
}
