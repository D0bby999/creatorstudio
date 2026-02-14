// Facebook Pages client implementing SocialPlatformClient
// Supports text, photo, and video posts to Facebook Pages

import type {
  SocialPlatformClient,
  PostParams,
  PlatformPostResponse,
  PlatformInsights,
  PlatformProfile,
  TokenRefreshResult,
} from './platform-interface'
import {
  postToPageFeed,
  uploadPhotoToPage,
  uploadVideoToPage,
  getPagePostInsights,
} from './facebook-api-helpers'
import { refreshLongLivedToken, metaGraphFetch } from './meta-api-helpers'

export class FacebookClient implements SocialPlatformClient {
  platform = 'facebook' as const

  constructor(
    private userAccessToken: string,
    private pageId: string,
    private pageAccessToken: string,
    private appId?: string,
    private appSecret?: string
  ) {}

  /**
   * Post to Facebook Page feed
   * Routes to text/photo/video based on mediaUrls
   */
  async post(params: PostParams): Promise<PlatformPostResponse> {
    const { content, mediaUrls } = params

    let postId: string

    if (mediaUrls.length === 0) {
      // Text-only post
      const result = await postToPageFeed(this.pageAccessToken, this.pageId, content)
      postId = result.id
    } else if (mediaUrls.length === 1) {
      // Single media post
      const mediaUrl = mediaUrls[0]
      const isVideo = this.isVideoUrl(mediaUrl)

      if (isVideo) {
        const result = await uploadVideoToPage(
          this.pageAccessToken,
          this.pageId,
          mediaUrl,
          content
        )
        postId = result.id
      } else {
        const result = await uploadPhotoToPage(
          this.pageAccessToken,
          this.pageId,
          mediaUrl,
          content
        )
        postId = result.id
      }
    } else {
      // Multiple photos (Facebook supports up to 10)
      // For simplicity, post first image with caption
      const result = await uploadPhotoToPage(
        this.pageAccessToken,
        this.pageId,
        mediaUrls[0],
        content
      )
      postId = result.id
    }

    // Extract post ID (format: pageId_postId)
    const postIdPart = postId.split('_')[1] || postId

    return {
      id: postId,
      url: `https://www.facebook.com/${this.pageId}/posts/${postIdPart}`,
    }
  }

  /**
   * Get post insights from Facebook Page
   */
  async getPostInsights(postId: string): Promise<PlatformInsights> {
    const insights = await getPagePostInsights(this.pageAccessToken, postId)

    return {
      impressions: insights.postImpressions,
      reach: insights.postEngagedUsers, // Use engaged users as proxy for reach
      likes: insights.postReactions,
      comments: 0, // Would need separate API call
      shares: 0, // Would need separate API call
      saves: 0, // Not available via API
    }
  }

  /**
   * Get Facebook Page profile information
   */
  async getUserProfile(_userId: string): Promise<PlatformProfile> {
    const data = await metaGraphFetch<{
      id: string
      name: string
      username?: string
    }>(`/${this.pageId}`, {
      accessToken: this.pageAccessToken,
      body: { fields: 'id,name,username' },
    })

    return {
      id: data.id,
      username: data.username || data.id,
      displayName: data.name,
    }
  }

  /**
   * Refresh Facebook access token (exchange for long-lived token)
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    if (!this.appId || !this.appSecret) {
      throw new Error('App ID and App Secret required for token refresh')
    }

    return await refreshLongLivedToken(
      this.userAccessToken,
      this.appId,
      this.appSecret
    )
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
