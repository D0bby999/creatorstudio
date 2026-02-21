// Twitter API v2 client with resilient fetch, media upload, and thread support
// Requires Twitter Developer API access (Basic tier $100/mo for posting)

import type {
  SocialPlatformClient,
  PostParams,
  PlatformPostResponse,
  PlatformInsights,
  PlatformProfile,
  TokenRefreshResult,
} from './platform-interface'
import type { ClientOptions } from './client-options'
import { noopLogger, type SocialLogger } from './social-logger'
import { auditLog } from './audit-logger'
import { createTweet, uploadMediaChunked, refreshOAuth2Token } from './twitter-api-helpers'

const TWITTER_API_BASE = 'https://api.twitter.com/2'

export class TwitterClient implements SocialPlatformClient {
  platform = 'twitter' as const
  private accessToken: string
  private readonly fetchFn: typeof fetch
  private readonly logger: SocialLogger
  private clientId?: string
  private clientSecret?: string
  private refreshTokenValue?: string

  constructor(
    accessToken: string,
    options?: ClientOptions & {
      clientId?: string
      clientSecret?: string
      refreshToken?: string
    }
  ) {
    this.accessToken = accessToken
    this.fetchFn = options?.fetchFn ?? fetch
    this.logger = options?.logger ?? noopLogger
    this.clientId = options?.clientId
    this.clientSecret = options?.clientSecret
    this.refreshTokenValue = options?.refreshToken
  }

  async post(params: PostParams): Promise<PlatformPostResponse> {
    let mediaIds: string[] | undefined

    // Upload media if provided (max 4 images for Twitter)
    if (params.mediaUrls.length > 0) {
      mediaIds = []
      const urls = params.mediaUrls.slice(0, 4)
      for (const url of urls) {
        const mediaRes = await this.fetchFn(url)
        if (!mediaRes.ok) {
          this.logger.warn('Failed to fetch media for upload', { url })
          continue
        }
        const buffer = Buffer.from(await mediaRes.arrayBuffer())
        const mimeType = mediaRes.headers.get('content-type') ?? 'image/jpeg'
        const result = await uploadMediaChunked(this.fetchFn, this.accessToken, buffer, mimeType)
        mediaIds.push(result.mediaId)
      }
      if (mediaIds.length === 0) mediaIds = undefined
    }

    const tweet = await createTweet(this.fetchFn, this.accessToken, params.content, { mediaIds })

    auditLog({
      action: 'post.create',
      userId: params.userId,
      platform: 'twitter',
      contentPreview: params.content,
    })

    return {
      id: tweet.id,
      url: `https://twitter.com/i/status/${tweet.id}`,
    }
  }

  async postThread(posts: PostParams[]): Promise<PlatformPostResponse[]> {
    const results: PlatformPostResponse[] = []
    let previousTweetId: string | undefined

    for (const post of posts) {
      const tweet = await createTweet(this.fetchFn, this.accessToken, post.content, {
        replyToId: previousTweetId,
      })

      previousTweetId = tweet.id
      results.push({
        id: tweet.id,
        url: `https://twitter.com/i/status/${tweet.id}`,
      })
    }

    auditLog({
      action: 'post.create',
      userId: posts[0]?.userId ?? 'unknown',
      platform: 'twitter',
      metadata: { threadLength: posts.length },
    })

    return results
  }

  async getPostInsights(postId: string): Promise<PlatformInsights> {
    const url = `${TWITTER_API_BASE}/tweets/${postId}?tweet.fields=public_metrics`
    const response = await this.fetchFn(url, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data = await response.json()
    const metrics = data.data.public_metrics

    return {
      impressions: metrics.impression_count ?? 0,
      reach: metrics.impression_count ?? 0,
      likes: metrics.like_count ?? 0,
      comments: metrics.reply_count ?? 0,
      shares: metrics.retweet_count ?? 0,
      saves: metrics.bookmark_count ?? 0,
    }
  }

  async getUserProfile(userId: string): Promise<PlatformProfile> {
    const url = `${TWITTER_API_BASE}/users/${userId}?user.fields=name,username`
    const response = await this.fetchFn(url, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      id: data.data.id,
      username: data.data.username,
      displayName: data.data.name,
    }
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    if (!this.clientId || !this.clientSecret || !this.refreshTokenValue) {
      throw new Error('Twitter OAuth2 refresh requires clientId, clientSecret, and refreshToken')
    }

    const result = await refreshOAuth2Token(this.clientId, this.clientSecret, this.refreshTokenValue, this.fetchFn)

    this.accessToken = result.accessToken
    this.refreshTokenValue = result.refreshToken

    auditLog({
      action: 'token.refresh',
      userId: 'system',
      platform: 'twitter',
    })

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    }
  }
}
