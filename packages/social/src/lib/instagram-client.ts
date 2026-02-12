// Instagram Graph API client for Creator Studio
// Requires Meta Business API approval and valid access tokens

import type {
  InstagramPostResponse,
  InstagramInsights,
} from '../types/social-types'

const INSTAGRAM_GRAPH_API_VERSION = 'v19.0'
const INSTAGRAM_GRAPH_API_BASE = `https://graph.instagram.com/${INSTAGRAM_GRAPH_API_VERSION}`

export class InstagramClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Create a media container (required before publishing)
   * Instagram API requires 2-step process: create container, then publish
   */
  async createMediaContainer(params: {
    imageUrl?: string
    videoUrl?: string
    caption: string
    userId: string
  }): Promise<{ id: string }> {
    const { imageUrl, videoUrl, caption, userId } = params

    const mediaType = videoUrl ? 'video' : 'image'
    const mediaUrl = videoUrl || imageUrl

    if (!mediaUrl) {
      throw new Error('Either imageUrl or videoUrl is required')
    }

    const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}/media`
    const body = new URLSearchParams({
      [mediaType === 'video' ? 'video_url' : 'image_url']: mediaUrl,
      caption,
      access_token: this.accessToken,
    })

    const response = await fetch(url, {
      method: 'POST',
      body,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return { id: data.id }
  }

  /**
   * Publish a media container
   */
  async publishMedia(params: {
    userId: string
    creationId: string
  }): Promise<InstagramPostResponse> {
    const { userId, creationId } = params

    const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}/media_publish`
    const body = new URLSearchParams({
      creation_id: creationId,
      access_token: this.accessToken,
    })

    const response = await fetch(url, {
      method: 'POST',
      body,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return { id: data.id }
  }

  /**
   * Post to Instagram (combines create + publish)
   */
  async post(params: {
    userId: string
    imageUrl?: string
    videoUrl?: string
    caption: string
  }): Promise<InstagramPostResponse> {
    // Create media container
    const container = await this.createMediaContainer(params)

    // Publish media
    const published = await this.publishMedia({
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
    const { userId, imageUrl, videoUrl } = params
    const mediaUrl = videoUrl || imageUrl

    if (!mediaUrl) {
      throw new Error('Either imageUrl or videoUrl is required for stories')
    }

    const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}/media`
    const body = new URLSearchParams({
      [videoUrl ? 'video_url' : 'image_url']: mediaUrl,
      media_type: 'STORIES',
      access_token: this.accessToken,
    })

    const response = await fetch(url, {
      method: 'POST',
      body,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()

    // Publish story
    return await this.publishMedia({
      userId,
      creationId: data.id,
    })
  }

  /**
   * Get post insights (analytics)
   */
  async getPostInsights(mediaId: string): Promise<InstagramInsights> {
    const metrics = ['impressions', 'reach', 'likes', 'comments', 'shares', 'saved']
    const url = `${INSTAGRAM_GRAPH_API_BASE}/${mediaId}/insights`
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

    // Parse Instagram insights response
    for (const item of data.data || []) {
      const metric = item.name.toLowerCase()
      if (metric in insights) {
        insights[metric as keyof InstagramInsights] = item.values[0]?.value || 0
      }
    }

    return insights
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<{
    id: string
    username: string
    accountType: string
  }> {
    const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}`
    const params = new URLSearchParams({
      fields: 'id,username,account_type',
      access_token: this.accessToken,
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
    }

    return await response.json()
  }

  /**
   * Refresh long-lived access token (60-day expiry)
   */
  async refreshAccessToken(): Promise<{
    accessToken: string
    expiresIn: number
  }> {
    const url = `${INSTAGRAM_GRAPH_API_BASE}/refresh_access_token`
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
}
