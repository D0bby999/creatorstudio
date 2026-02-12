// Social media post scheduler using Inngest
// Handles scheduled post publishing with retries and error handling

import { prisma } from '@creator-studio/db/client'
import { InstagramClient } from './instagram-client'
import type { ScheduledPostJob } from '../types/social-types'

/**
 * Get posts that are due to be published
 */
export async function getDuePosts(): Promise<ScheduledPostJob[]> {
  const now = new Date()

  const posts = await prisma.socialPost.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      socialAccountId: true,
      scheduledAt: true,
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  })

  return posts.map((post) => ({
    postId: post.id,
    socialAccountId: post.socialAccountId,
    scheduledAt: post.scheduledAt!,
  }))
}

/**
 * Publish a scheduled post to social media
 */
export async function publishPost(postId: string): Promise<void> {
  // Fetch post and account details
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: {
      socialAccount: true,
    },
  })

  if (!post) {
    throw new Error(`Post not found: ${postId}`)
  }

  if (post.status !== 'scheduled') {
    throw new Error(`Post is not scheduled: ${postId} (status: ${post.status})`)
  }

  try {
    // Update status to publishing
    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: 'publishing' },
    })

    // Publish based on platform
    let platformPostId: string

    if (post.platform === 'instagram') {
      const client = new InstagramClient(post.socialAccount.accessToken)

      // Instagram requires media URL (first URL in mediaUrls array)
      const mediaUrl = post.mediaUrls[0]
      if (!mediaUrl) {
        throw new Error('Instagram posts require at least one media URL')
      }

      const response = await client.post({
        userId: post.socialAccount.platformUserId,
        imageUrl: mediaUrl.endsWith('.mp4') ? undefined : mediaUrl,
        videoUrl: mediaUrl.endsWith('.mp4') ? mediaUrl : undefined,
        caption: post.content,
      })

      platformPostId = response.id
    } else {
      throw new Error(`Unsupported platform: ${post.platform}`)
    }

    // Update post status to published
    await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        platformPostId,
      },
    })

    console.log(`Successfully published post ${postId} to ${post.platform}`)
  } catch (error) {
    // Update status to failed
    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: 'failed' },
    })

    console.error(`Failed to publish post ${postId}:`, error)
    throw error
  }
}

/**
 * Schedule a post for future publishing
 */
export async function schedulePost(params: {
  content: string
  mediaUrls: string[]
  scheduledAt: Date
  socialAccountId: string
}): Promise<string> {
  const { content, mediaUrls, scheduledAt, socialAccountId } = params

  // Validate scheduled time is in the future
  if (scheduledAt <= new Date()) {
    throw new Error('Scheduled time must be in the future')
  }

  // Get social account to determine platform
  const socialAccount = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  })

  if (!socialAccount) {
    throw new Error(`Social account not found: ${socialAccountId}`)
  }

  // Create scheduled post
  const post = await prisma.socialPost.create({
    data: {
      content,
      mediaUrls,
      platform: socialAccount.platform,
      scheduledAt,
      status: 'scheduled',
      socialAccountId,
    },
  })

  console.log(`Scheduled post ${post.id} for ${scheduledAt.toISOString()}`)

  return post.id
}

/**
 * Cancel a scheduled post
 */
export async function cancelScheduledPost(postId: string): Promise<void> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
  })

  if (!post) {
    throw new Error(`Post not found: ${postId}`)
  }

  if (post.status !== 'scheduled') {
    throw new Error(`Cannot cancel post with status: ${post.status}`)
  }

  await prisma.socialPost.update({
    where: { id: postId },
    data: { status: 'draft' },
  })

  console.log(`Cancelled scheduled post ${postId}`)
}

/**
 * Inngest function definition (for production use)
 * This would be registered in apps/web with Inngest
 */
export const inngestSchedulerConfig = {
  id: 'social-post-scheduler',
  name: 'Publish Scheduled Social Posts',
  // Run every minute to check for due posts
  cron: '* * * * *',
  handler: async () => {
    const duePosts = await getDuePosts()

    console.log(`Found ${duePosts.length} posts due for publishing`)

    // Process posts with error handling
    const results = await Promise.allSettled(
      duePosts.map((job) => publishPost(job.postId))
    )

    // Log any failures
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
