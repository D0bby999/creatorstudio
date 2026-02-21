// Inngest function for publishing scheduled social posts
// Health check + error categorization + auth retry fallback

import { inngest } from '../inngest-client'
import { prisma } from '@creator-studio/db/client'
import { getPlatformClient } from '@creator-studio/social/factory'
import { classifyError } from '@creator-studio/social/errors'
import { PlatformHealthTracker } from '@creator-studio/social/health'
import { decryptToken, encryptToken } from '~/lib/token-encryption'
import type { SocialPlatform } from '@creator-studio/social/types'

interface SocialPostScheduledEvent {
  data: {
    postId: string
    scheduledAt: string
  }
}

export const socialPostPublisher = inngest.createFunction(
  {
    id: 'publish-social-post',
    name: 'Publish Scheduled Social Post',
    retries: 3,
  },
  { event: 'social/post.scheduled' },
  async ({ event, step }) => {
    const { postId, scheduledAt } = event.data as SocialPostScheduledEvent['data']

    await step.sleepUntil('wait-for-schedule', new Date(scheduledAt))

    // Step 1: Load post and account
    const post = await step.run('load-post', async () => {
      const result = await prisma.socialPost.findUnique({
        where: { id: postId },
        include: { socialAccount: true },
      })

      if (!result) throw new Error(`Post not found: ${postId}`)
      if (result.status !== 'scheduled') {
        throw new Error(`Post status is ${result.status}, expected 'scheduled'`)
      }

      return result
    })

    // Step 2: Check platform health
    const isHealthy = await step.run('check-platform-health', async () => {
      const health = PlatformHealthTracker.getInstance().getMetrics(post.platform)
      if (health.status === 'unhealthy') {
        await prisma.socialPost.update({
          where: { id: postId },
          data: {
            failureReason: `Platform ${post.platform} is unhealthy, deferring`,
            retryCount: { increment: 1 },
          },
        })
        return false
      }
      return true
    })

    if (!isHealthy) {
      return { postId, status: 'deferred', reason: 'platform_unhealthy' }
    }

    // Step 3: Mark as publishing
    await step.run('mark-publishing', async () => {
      await prisma.socialPost.update({
        where: { id: postId },
        data: { status: 'publishing' },
      })
    })

    // Step 4: Publish to platform (with auth retry fallback)
    const platformPostId = await step.run('publish-to-platform', async () => {
      const token = decryptToken(post.socialAccount.accessToken)
      const metadata = post.socialAccount.metadata as Record<string, string> | null

      const platformParams: Record<string, unknown> = {}
      if (metadata?.pageId) platformParams.pageId = metadata.pageId
      if (metadata?.pageAccessToken) {
        platformParams.pageAccessToken = decryptToken(metadata.pageAccessToken)
      }
      if (metadata?.handle) platformParams.handle = metadata.handle
      if (metadata?.appPassword) platformParams.appPassword = metadata.appPassword
      if (metadata?.openId) platformParams.openId = metadata.openId
      if (metadata?.refreshToken) platformParams.refreshToken = metadata.refreshToken
      if (metadata?.clientKey) platformParams.clientKey = metadata.clientKey
      if (metadata?.clientSecret) platformParams.clientSecret = metadata.clientSecret

      const client = getPlatformClient(
        post.platform as SocialPlatform,
        token,
        platformParams
      )

      try {
        const response = await client.post({
          userId: post.socialAccount.platformUserId,
          content: post.content,
          mediaUrls: post.mediaUrls,
        })
        return response.id
      } catch (error) {
        const classified = classifyError(error, post.platform)

        // On auth error, attempt token refresh then retry once
        if (classified.category === 'auth') {
          try {
            const refreshResult = await client.refreshToken()
            const retryClient = getPlatformClient(
              post.platform as SocialPlatform,
              refreshResult.accessToken,
              platformParams
            )
            const retryResponse = await retryClient.post({
              userId: post.socialAccount.platformUserId,
              content: post.content,
              mediaUrls: post.mediaUrls,
            })

            // Update stored token on successful refresh (encrypted)
            await prisma.socialAccount.update({
              where: { id: post.socialAccountId },
              data: {
                accessToken: encryptToken(refreshResult.accessToken),
                tokenRefreshedAt: new Date(),
              },
            })

            return retryResponse.id
          } catch {
            // Refresh also failed — fall through to failure handling
          }
        }

        // Store failure reason and rethrow
        await prisma.socialPost.update({
          where: { id: postId },
          data: {
            failureReason: classified.message,
            retryCount: { increment: 1 },
          },
        })
        throw classified
      }
    })

    // Step 5: Mark published
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

    return { postId, platformPostId, publishedAt: new Date().toISOString() }
  }
)
