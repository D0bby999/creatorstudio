// Threads client implementing SocialPlatformClient
// Container-based publishing: create → poll → publish workflow

import type {
  SocialPlatformClient,
  PostParams,
  PlatformPostResponse,
  PlatformInsights,
  PlatformProfile,
  TokenRefreshResult,
} from './platform-interface'
import type { ThreadsMediaType } from '../types/threads-types'
import {
  createThreadsContainer,
  publishThread,
  enforceHashtagLimit,
} from './threads-api-helpers'
import { refreshLongLivedToken, metaGraphFetch } from './meta-api-helpers'

export class ThreadsClient implements SocialPlatformClient {
  platform = 'threads' as const

  constructor(
    private accessToken: string,
    private userId?: string,
    private appId?: string,
    private appSecret?: string
  ) {}

  /**
   * Post to Threads using container-based workflow
   * 1. Create container (with media if any)
   * 2. Poll until processing complete
   * 3. Publish container
   */
  async post(params: PostParams): Promise<PlatformPostResponse> {
    if (!this.userId) {
      // Fetch user ID if not provided
      const profile = await this.getUserProfile('')
      this.userId = profile.id
    }

    const { content, mediaUrls } = params

    // Enforce hashtag limit (only first hashtag is clickable on Threads)
    const processedContent = enforceHashtagLimit(content)

    // Determine media type
    let mediaType: ThreadsMediaType = 'TEXT'
    let imageUrl: string | undefined
    let videoUrl: string | undefined

    if (mediaUrls.length > 0) {
      const firstMedia = mediaUrls[0]
      const isVideo = this.isVideoUrl(firstMedia)

      if (isVideo) {
        mediaType = 'VIDEO'
        videoUrl = firstMedia
      } else {
        mediaType = 'IMAGE'
        imageUrl = firstMedia
      }
    }

    // Create container
    const container = await createThreadsContainer(this.accessToken, this.userId, {
      mediaType,
      text: processedContent,
      imageUrl,
      videoUrl,
    })

    // Publish (includes polling)
    const published = await publishThread(this.accessToken, this.userId, container.id)

    return {
      id: published.id,
      url: `https://www.threads.net/@${this.userId}/post/${published.id}`,
    }
  }

  /**
   * Get Threads post insights
   */
  async getPostInsights(postId: string): Promise<PlatformInsights> {
    try {
      const data = await metaGraphFetch<{
        data: Array<{ name: string; values: Array<{ value: number }> }>
      }>(`/${postId}/insights`, {
        accessToken: this.accessToken,
        body: {
          metric: 'views,likes,replies,reposts,quotes',
        },
      })

      const insights: Record<string, number> = {}

      data.data.forEach((metric) => {
        const value = metric.values[0]?.value || 0
        insights[metric.name] = value
      })

      return {
        impressions: insights.views || 0,
        reach: insights.views || 0, // Use views as proxy for reach
        likes: insights.likes || 0,
        comments: insights.replies || 0,
        shares: (insights.reposts || 0) + (insights.quotes || 0),
        saves: 0, // Not available
      }
    } catch {
      // Return zeros if insights not available
      return {
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
      }
    }
  }

  /**
   * Get Threads user profile
   */
  async getUserProfile(_userId: string): Promise<PlatformProfile> {
    const data = await metaGraphFetch<{
      id: string
      username: string
      threads_profile_picture_url?: string
    }>('/me', {
      accessToken: this.accessToken,
      body: {
        fields: 'id,username,threads_profile_picture_url',
      },
    })

    return {
      id: data.id,
      username: data.username,
      displayName: data.username,
    }
  }

  /**
   * Refresh Threads access token (exchange for long-lived token)
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    if (!this.appId || !this.appSecret) {
      throw new Error('App ID and App Secret required for token refresh')
    }

    return await refreshLongLivedToken(this.accessToken, this.appId, this.appSecret)
  }

  /**
   * Helper to detect video URLs
   */
  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
    const lowerUrl = url.toLowerCase()
    return videoExtensions.some((ext) => lowerUrl.includes(ext))
  }
}
