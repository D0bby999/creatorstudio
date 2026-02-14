// TikTok client implementing SocialPlatformClient
// Video-only platform with direct/chunked upload support

import type {
  SocialPlatformClient,
  PostParams,
  PlatformPostResponse,
  PlatformInsights,
  PlatformProfile,
  TokenRefreshResult,
} from './platform-interface'
import {
  initVideoPost,
  directUpload,
  chunkedUpload,
  pollPublishStatus,
  refreshTikTokToken,
  fetchTikTokUserInfo,
} from './tiktok-api-helpers'
import { resolveAndValidateUrl } from '@creator-studio/utils/ssrf-validator'

export class TikTokClient implements SocialPlatformClient {
  platform = 'tiktok' as const
  private static CHUNK_SIZE = 10 * 1024 * 1024 // 10MB
  private static MAX_DIRECT_SIZE = 64 * 1024 * 1024 // 64MB

  constructor(
    private accessToken: string,
    private openId?: string,
    private clientKey?: string,
    private clientSecret?: string,
    private refreshTokenValue?: string
  ) {}

  /**
   * Post video to TikTok
   * 1. Validate exactly 1 video URL
   * 2. Fetch video binary
   * 3. Init video post
   * 4. Upload (direct if <64MB, else chunked)
   * 5. Poll until PUBLISH_COMPLETE
   */
  async post(params: PostParams): Promise<PlatformPostResponse> {
    const { content, mediaUrls } = params

    // TikTok only supports video posts
    if (mediaUrls.length !== 1) {
      throw new Error('TikTok requires exactly 1 video URL')
    }

    const videoUrl = mediaUrls[0]

    // Validate URL with DNS resolution to prevent SSRF
    await resolveAndValidateUrl(videoUrl)

    // Fetch video data
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video from ${videoUrl}`)
    }

    const videoData = await videoResponse.arrayBuffer()
    const videoSize = videoData.byteLength

    // Determine upload method
    const useChunked = videoSize > TikTokClient.MAX_DIRECT_SIZE
    const chunkSize = useChunked ? TikTokClient.CHUNK_SIZE : undefined
    const totalChunkCount = useChunked ? Math.ceil(videoSize / TikTokClient.CHUNK_SIZE) : undefined

    // Initialize video post
    const initParams = {
      title: content.slice(0, 150), // TikTok title limit
      privacyLevel: 'PUBLIC_TO_EVERYONE' as const,
      videoSize,
      chunkSize,
      totalChunkCount,
    }

    const { publishId, uploadUrl } = await initVideoPost(this.accessToken, initParams)

    // Upload video
    if (useChunked) {
      await chunkedUpload(uploadUrl, videoData, TikTokClient.CHUNK_SIZE)
    } else {
      const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
      await directUpload(uploadUrl, videoData, contentType)
    }

    // Poll until complete
    const result = await pollPublishStatus(this.accessToken, publishId)

    if (result.status === 'FAILED') {
      throw new Error(`TikTok publish failed: ${result.failReason}`)
    }

    const postId = result.publiclyAvailablePostId?.[0] || publishId

    return {
      id: postId,
      url: `https://www.tiktok.com/@${this.openId}/video/${postId}`,
    }
  }

  /**
   * Get TikTok post insights
   * Note: TikTok analytics requires video.insights scope (not included in basic posting)
   * Returns zeros as placeholder
   */
  async getPostInsights(_postId: string): Promise<PlatformInsights> {
    return {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    }
  }

  async getUserProfile(_userId: string): Promise<PlatformProfile> {
    const userInfo = await fetchTikTokUserInfo(this.accessToken)

    return {
      id: userInfo.openId,
      username: userInfo.openId,
      displayName: userInfo.displayName,
    }
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    if (!this.clientKey || !this.clientSecret || !this.refreshTokenValue) {
      throw new Error('Client key, client secret, and refresh token required for token refresh')
    }

    const result = await refreshTikTokToken(
      this.clientKey,
      this.clientSecret,
      this.refreshTokenValue
    )

    this.refreshTokenValue = result.refreshToken

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    }
  }
}
