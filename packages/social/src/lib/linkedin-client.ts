// LinkedIn Marketing API v2 client with resilient fetch support
// Requires LinkedIn Developer app approval and OAuth2 tokens

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

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'
const LINKEDIN_OAUTH_BASE = 'https://www.linkedin.com/oauth/v2'

export class LinkedInClient implements SocialPlatformClient {
  platform = 'linkedin' as const
  private accessToken: string
  private readonly fetchFn: typeof fetch
  private readonly logger: SocialLogger
  private clientId?: string
  private clientSecret?: string
  private refreshTokenValue?: string

  constructor(
    accessToken: string,
    config?: {
      clientId?: string
      clientSecret?: string
      refreshToken?: string
    },
    options?: ClientOptions
  ) {
    this.accessToken = accessToken
    this.clientId = config?.clientId
    this.clientSecret = config?.clientSecret
    this.refreshTokenValue = config?.refreshToken
    this.fetchFn = options?.fetchFn ?? fetch
    this.logger = options?.logger ?? noopLogger
  }

  async post(params: PostParams): Promise<PlatformPostResponse> {
    const url = `${LINKEDIN_API_BASE}/ugcPosts`
    const body = {
      author: `urn:li:person:${params.userId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: params.content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const postId = data.id

    auditLog({
      action: 'post.create',
      userId: params.userId,
      platform: 'linkedin',
      contentPreview: params.content,
    })

    return {
      id: postId,
      url: `https://www.linkedin.com/feed/update/${postId}`,
    }
  }

  async getPostInsights(postId: string): Promise<PlatformInsights> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    }

    const likesUrl = `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}/likes`
    const commentsUrl = `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}/comments`

    const [likesRes, commentsRes] = await Promise.all([
      this.fetchFn(likesUrl, { headers }),
      this.fetchFn(commentsUrl, { headers }),
    ])

    let likes = 0
    if (likesRes.ok) {
      const data = await likesRes.json()
      likes = data.paging?.total ?? 0
    }

    let comments = 0
    if (commentsRes.ok) {
      const data = await commentsRes.json()
      comments = data.paging?.total ?? 0
    }

    return {
      impressions: 0,
      reach: 0,
      likes,
      comments,
      shares: 0,
      saves: 0,
    }
  }

  async getUserProfile(userId: string): Promise<PlatformProfile> {
    const url = `${LINKEDIN_API_BASE}/me?projection=(id,firstName,lastName)`
    const response = await this.fetchFn(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    })

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`)
    }

    const data = await response.json()
    const displayName = `${data.firstName?.localized?.en_US ?? ''} ${data.lastName?.localized?.en_US ?? ''}`.trim()

    return {
      id: data.id,
      username: data.id,
      displayName: displayName || undefined,
    }
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    if (!this.clientId || !this.clientSecret || !this.refreshTokenValue) {
      throw new Error('LinkedIn token refresh requires clientId, clientSecret, and refreshToken')
    }

    const url = `${LINKEDIN_OAUTH_BASE}/accessToken`
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshTokenValue,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`LinkedIn OAuth error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()

    // Update internal state with refreshed tokens
    this.accessToken = data.access_token
    if (data.refresh_token) {
      this.refreshTokenValue = data.refresh_token
    }

    auditLog({
      action: 'token.refresh',
      userId: 'system',
      platform: 'linkedin',
    })

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    }
  }
}
