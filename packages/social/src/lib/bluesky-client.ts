// Bluesky AT Protocol client implementing SocialPlatformClient
// Uses app passwords for authentication and AT Protocol for posting

import type {
  SocialPlatformClient,
  PostParams,
  PlatformPostResponse,
  PlatformInsights,
  PlatformProfile,
  TokenRefreshResult,
} from './platform-interface'

const BSKY_API_BASE = 'https://bsky.social/xrpc'

export class BlueskyClient implements SocialPlatformClient {
  platform = 'bluesky' as const
  private accessJwt = ''
  private refreshJwt = ''
  private did = ''

  constructor(
    private handle: string,
    private appPassword: string
  ) {}

  /**
   * Create authenticated session with Bluesky
   */
  async createSession(): Promise<void> {
    const res = await fetch(`${BSKY_API_BASE}/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: this.handle, password: this.appPassword }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(`Bluesky auth failed: ${res.status} ${JSON.stringify(error)}`)
    }
    const data = await res.json()
    this.accessJwt = data.accessJwt
    this.refreshJwt = data.refreshJwt
    this.did = data.did
  }

  /**
   * Ensure session is active before API calls
   */
  private async ensureSession(): Promise<void> {
    if (!this.accessJwt) {
      await this.createSession()
    }
  }

  /**
   * Post to Bluesky with optional images
   */
  async post(params: PostParams): Promise<PlatformPostResponse> {
    await this.ensureSession()

    // Upload images if any (max 4 per Bluesky spec)
    const images = []
    for (const url of params.mediaUrls.slice(0, 4)) {
      try {
        const imgRes = await fetch(url)
        if (!imgRes.ok) continue
        const blob = await imgRes.arrayBuffer()

        const uploadRes = await fetch(`${BSKY_API_BASE}/com.atproto.repo.uploadBlob`, {
          method: 'POST',
          headers: {
            'Content-Type': 'image/jpeg',
            Authorization: `Bearer ${this.accessJwt}`,
          },
          body: blob,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          images.push({ image: uploadData.blob, alt: '' })
        }
      } catch (err) {
        console.error('Failed to upload image to Bluesky:', err)
      }
    }

    // Build post record
    const record: any = {
      $type: 'app.bsky.feed.post',
      text: params.content,
      createdAt: new Date().toISOString(),
    }

    if (images.length > 0) {
      record.embed = { $type: 'app.bsky.embed.images', images }
    }

    // Create post record
    const res = await fetch(`${BSKY_API_BASE}/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.did,
        collection: 'app.bsky.feed.post',
        record,
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(`Bluesky post failed: ${res.status} ${JSON.stringify(error)}`)
    }

    const data = await res.json()
    const rkey = data.uri?.split('/').pop() ?? ''
    return {
      id: data.uri,
      url: `https://bsky.app/profile/${this.handle}/post/${rkey}`,
    }
  }

  /**
   * Get post insights (Bluesky doesn't have public analytics API yet)
   */
  async getPostInsights(_postId: string): Promise<PlatformInsights> {
    // Bluesky doesn't expose analytics via public API
    // Return zeros as placeholder
    return {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(_userId: string): Promise<PlatformProfile> {
    await this.ensureSession()

    const res = await fetch(`${BSKY_API_BASE}/app.bsky.actor.getProfile?actor=${this.did}`, {
      headers: { Authorization: `Bearer ${this.accessJwt}` },
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(`Failed to fetch Bluesky profile: ${JSON.stringify(error)}`)
    }

    const data = await res.json()
    return {
      id: data.did,
      username: data.handle,
      displayName: data.displayName,
    }
  }

  /**
   * Refresh session token
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    const res = await fetch(`${BSKY_API_BASE}/com.atproto.server.refreshSession`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.refreshJwt}` },
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(`Failed to refresh Bluesky session: ${JSON.stringify(error)}`)
    }

    const data = await res.json()
    this.accessJwt = data.accessJwt
    this.refreshJwt = data.refreshJwt

    return {
      accessToken: data.accessJwt,
      expiresIn: 7200, // 2 hours default
    }
  }
}
