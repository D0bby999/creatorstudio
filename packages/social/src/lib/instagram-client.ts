// Instagram Graph API client for Creator Studio
// Requires Meta Business API approval and valid access tokens

import type {
  InstagramPostResponse,
  InstagramInsights,
} from '../types/social-types'
import type {
  SocialPlatformClient,
  PostParams,
  PlatformPostResponse,
  PlatformInsights,
  PlatformProfile,
  TokenRefreshResult,
} from './platform-interface'
import {
  createMediaContainer,
  publishMedia,
  createStory,
  INSTAGRAM_API_BASE_URL,
} from './instagram-api-helpers'

export class InstagramClient implements SocialPlatformClient {
  platform = 'instagram' as const
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Post to Instagram with platform-agnostic interface
   */
  async post(params: PostParams): Promise<PlatformPostResponse> {
    const firstMediaUrl = params.mediaUrls[0]
    if (!firstMediaUrl) {
      throw new Error('At least one media URL is required for Instagram posts')
    }

    const isVideo = firstMediaUrl.includes('.mp4') || firstMediaUrl.includes('video')
    const result = await this.postInstagram({
      userId: params.userId,
      caption: params.content,
      imageUrl: isVideo ? undefined : firstMediaUrl,
      videoUrl: isVideo ? firstMediaUrl : undefined,
    })

    return {
      id: result.id,
      url: result.permalink,
    }
  }

  /**
   * Internal Instagram-specific post method
   */
  private async postInstagram(params: {
    userId: string
    imageUrl?: string
    videoUrl?: string
    caption: string
  }): Promise<InstagramPostResponse> {
    const container = await createMediaContainer(this.accessToken, params)
    const published = await publishMedia(this.accessToken, {
      userId: params.userId,
      creationId: container.id,
    })
    return published
  }

  /**
   * Create Instagram Story
   */
  async postStory(params: {
    userId: string
    imageUrl?: string
    videoUrl?: string
  }): Promise<InstagramPostResponse> {
    return await createStory(this.accessToken, params)
  }

  /**
   * Get post insights (analytics)
   */
  async getPostInsights(mediaId: string): Promise<PlatformInsights> {
    const metrics = ['impressions', 'reach', 'likes', 'comments', 'shares', 'saved']
    const url = `${INSTAGRAM_API_BASE_URL}/${mediaId}/insights`
    const params = new URLSearchParams({
      metric: metrics.join(','),
      access_token: this.accessToken,
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const insights: InstagramInsights = {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    }

    for (const item of data.data || []) {
      const metric = item.name.toLowerCase()
      if (metric in insights) {
        insights[metric as keyof InstagramInsights] = item.values[0]?.value || 0
      }
    }

    return insights
  }

  /**
   * Get user profile information (platform interface implementation)
   */
  async getUserProfile(userId: string): Promise<PlatformProfile> {
    const url = `${INSTAGRAM_API_BASE_URL}/${userId}`
    const params = new URLSearchParams({
      fields: 'id,username,name',
      access_token: this.accessToken,
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return {
      id: data.id,
      username: data.username,
      displayName: data.name,
    }
  }

  /**
   * Refresh long-lived access token (platform interface implementation)
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    const url = `${INSTAGRAM_API_BASE_URL}/refresh_access_token`
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: this.accessToken,
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    }
  }

  /**
   * Deprecated: Use refreshToken() instead
   */
  async refreshAccessToken(): Promise<TokenRefreshResult> {
    return this.refreshToken()
  }
}
