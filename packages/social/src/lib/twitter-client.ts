// Twitter API v2 client for Creator Studio
// Requires Twitter Developer API access and OAuth2 tokens

import type {
  SocialPlatformClient,
  PostParams,
  PlatformPostResponse,
  PlatformInsights,
  PlatformProfile,
  TokenRefreshResult,
} from './platform-interface'

const TWITTER_API_BASE = 'https://api.twitter.com/2'

export class TwitterClient implements SocialPlatformClient {
  platform = 'twitter' as const
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async post(params: PostParams): Promise<PlatformPostResponse> {
    const url = `${TWITTER_API_BASE}/tweets`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: params.content }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Twitter API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    return {
      id: data.data.id,
      url: `https://twitter.com/i/status/${data.data.id}`,
    }
  }

  async getPostInsights(postId: string): Promise<PlatformInsights> {
    const url = `${TWITTER_API_BASE}/tweets/${postId}?tweet.fields=public_metrics`
    const response = await fetch(url, {
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
    const response = await fetch(url, {
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
    throw new Error('Twitter OAuth2 token refresh requires client credentials. Use OAuth2 PKCE flow.')
  }
}
