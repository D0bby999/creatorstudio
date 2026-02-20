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
import { createLogger, noopLogger, type SocialLogger } from './social-logger'
import type { ClientOptions } from './client-options'
import { auditLog } from './audit-logger'
import { createSafeErrorMessage } from './error-sanitizer'

const BSKY_API_BASE = 'https://bsky.social/xrpc'

export class BlueskyClient implements SocialPlatformClient {
  platform = 'bluesky' as const
  private accessJwt = ''
  private refreshJwt = ''
  private did = ''
  private readonly fetchFn: typeof fetch
  private readonly logger: SocialLogger

  constructor(
    private handle: string,
    private appPassword: string,
    options?: ClientOptions
  ) {
    this.fetchFn = options?.fetchFn ?? fetch
    this.logger = options?.logger ?? createLogger('social:bluesky')
  }

  /**
   * Create authenticated session with Bluesky
   */
  async createSession(): Promise<void> {
    const res = await this.fetchFn(`${BSKY_API_BASE}/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: this.handle, password: this.appPassword }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(createSafeErrorMessage(`Bluesky auth failed (${res.status})`, error))
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
        const imgRes = await this.fetchFn(url)
        if (!imgRes.ok) continue
        const blob = await imgRes.arrayBuffer()

        const uploadRes = await this.fetchFn(`${BSKY_API_BASE}/com.atproto.repo.uploadBlob`, {
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
        this.logger.warn('Image upload failed', { error: String(err) })
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
    const res = await this.fetchFn(`${BSKY_API_BASE}/com.atproto.repo.createRecord`, {
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
      throw new Error(createSafeErrorMessage(`Bluesky post failed (${res.status})`, error))
    }

    const data = await res.json()
    const rkey = data.uri?.split('/').pop() ?? ''

    auditLog({
      action: 'post.create',
      userId: params.userId,
      platform: 'bluesky',
      contentPreview: params.content,
    })

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

    const res = await this.fetchFn(`${BSKY_API_BASE}/app.bsky.actor.getProfile?actor=${this.did}`, {
      headers: { Authorization: `Bearer ${this.accessJwt}` },
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(createSafeErrorMessage('Failed to fetch Bluesky profile', error))
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
    const res = await this.fetchFn(`${BSKY_API_BASE}/com.atproto.server.refreshSession`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.refreshJwt}` },
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(createSafeErrorMessage('Failed to refresh Bluesky session', error))
    }

    const data = await res.json()
    this.accessJwt = data.accessJwt
    this.refreshJwt = data.refreshJwt

    auditLog({
      action: 'token.refresh',
      userId: 'system',
      platform: 'bluesky',
    })

    return {
      accessToken: data.accessJwt,
      expiresIn: 7200, // 2 hours default
    }
  }
}
