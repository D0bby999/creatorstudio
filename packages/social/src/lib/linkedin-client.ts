// LinkedIn Marketing API v2 client for Creator Studio
// Requires LinkedIn Developer app approval and OAuth2 tokens

import type {
  SocialPlatformClient,
  PostParams,
  PlatformPostResponse,
  PlatformInsights,
  PlatformProfile,
  TokenRefreshResult,
} from './platform-interface'

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'
const LINKEDIN_OAUTH_BASE = 'https://www.linkedin.com/oauth/v2'

export class LinkedInClient implements SocialPlatformClient {
  platform = 'linkedin' as const
  private accessToken: string
  private clientId?: string
  private clientSecret?: string
  private refreshTokenValue?: string

  constructor(accessToken: string, config?: {
    clientId?: string
    clientSecret?: string
    refreshToken?: string
  }) {
    this.accessToken = accessToken
    this.clientId = config?.clientId
    this.clientSecret = config?.clientSecret
    this.refreshTokenValue = config?.refreshToken
  }

  async post(params: PostParams): Promise<PlatformPostResponse> {
    const url = `${LINKEDIN_API_BASE}/ugcPosts`
    const body = {
      author: `urn:li:person:${params.userId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: params.content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    const response = await fetch(url, {
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
    return {
      id: postId,
      url: `https://www.linkedin.com/feed/update/${postId}`,
    }
  }

  async getPostInsights(postId: string): Promise<PlatformInsights> {
    // Fetch likes count
    const likesUrl = `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}/likes`
    const likesResponse = await fetch(likesUrl, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    })

    let likes = 0
    if (likesResponse.ok) {
      const likesData = await likesResponse.json()
      likes = likesData.paging?.total ?? 0
    }

    // Fetch comments count
    const commentsUrl = `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}/comments`
    const commentsResponse = await fetch(commentsUrl, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    })

    let comments = 0
    if (commentsResponse.ok) {
      const commentsData = await commentsResponse.json()
      comments = commentsData.paging?.total ?? 0
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
    const response = await fetch(url, {
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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`LinkedIn OAuth error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    }
  }
}
