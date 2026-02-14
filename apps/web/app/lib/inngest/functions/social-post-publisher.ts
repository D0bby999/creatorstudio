// Inngest function for publishing scheduled social posts
// Triggers at scheduled time and publishes to platform

import type { EventSchemas } from 'inngest'
import { inngest } from '../inngest-client'
import { prisma } from '@creator-studio/db/client'
import { getPlatformClient } from '@creator-studio/social/factory'
import { decryptToken } from '~/lib/token-encryption'
import type { SocialPlatform } from '@creator-studio/social/types'

/**
 * Event payload for social post scheduling
 */
interface SocialPostScheduledEvent {
  data: {
    postId: string
    scheduledAt: string
  }
}

/**
 * Publishes a scheduled social post to its platform
 * Handles token decryption, platform client creation, and status updates
 */
export const socialPostPublisher = inngest.createFunction(
  {
    id: 'publish-social-post',
    name: 'Publish Scheduled Social Post',
    retries: 3,
  },
  { event: 'social/post.scheduled' },
  async ({ event, step }) => {
    const { postId, scheduledAt } = event.data as SocialPostScheduledEvent['data']

    // Step 1: Wait until scheduled time
    await step.sleepUntil('wait-for-schedule', new Date(scheduledAt))

    // Step 2: Load post and account from database
    const post = await step.run('load-post', async () => {
      const result = await prisma.socialPost.findUnique({
        where: { id: postId },
        include: { socialAccount: true },
      })

      if (!result) {
        throw new Error(`Post not found: ${postId}`)
      }

      if (result.status !== 'scheduled') {
        throw new Error(`Post status is ${result.status}, expected 'scheduled'`)
      }

      return result
    })

    // Step 3: Mark as publishing
    await step.run('mark-publishing', async () => {
      await prisma.socialPost.update({
        where: { id: postId },
        data: { status: 'publishing' },
      })
    })

    // Step 4: Publish to platform
    const platformPostId = await step.run('publish-to-platform', async () => {
      const token = decryptToken(post.socialAccount.accessToken)
      const metadata = post.socialAccount.metadata as Record<string, string> | null

      // Build platform-specific params
      const platformParams: Record<string, unknown> = {}
      if (metadata?.pageId) platformParams.pageId = metadata.pageId
      if (metadata?.pageAccessToken) {
        platformParams.pageAccessToken = decryptToken(metadata.pageAccessToken)
      }
      if (metadata?.handle) platformParams.handle = metadata.handle
      if (metadata?.appPassword) platformParams.appPassword = metadata.appPassword
      if (metadata?.openId) platformParams.openId = metadata.openId

      const client = getPlatformClient(
        post.platform as SocialPlatform,
        token,
        platformParams
      )

      const response = await client.post({
        userId: post.socialAccount.platformUserId,
        content: post.content,
        mediaUrls: post.mediaUrls,
      })

      return response.id
    })

    // Step 5: Update post status to published
    await step.run('mark-published', async () => {
      await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: 'published',
          publishedAt: new Date(),
          platformPostId,
        },
      })
    })

    return {
      postId,
      platformPostId,
      publishedAt: new Date().toISOString(),
    }
  }
)
