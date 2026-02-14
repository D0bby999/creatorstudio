/**
 * Social Platform Plugin Template
 *
 * Use this template to create plugins that integrate with social media platforms.
 * Implement the SocialPlatformPlugin interface to add custom platform support.
 */

export interface SocialPost {
  content: string
  mediaUrls?: string[]
  scheduledAt?: Date
  metadata?: Record<string, unknown>
}

export interface SocialAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface SocialPlatformPlugin {
  /** Platform identifier (e.g., 'twitter', 'linkedin') */
  platformId: string

  /** Display name of the platform */
  platformName: string

  /** Initialize OAuth flow and return authorization URL */
  getAuthUrl(config: SocialAuthConfig): Promise<string>

  /** Exchange authorization code for access token */
  exchangeCode(code: string, config: SocialAuthConfig): Promise<{ accessToken: string; refreshToken?: string }>

  /** Refresh access token */
  refreshToken(refreshToken: string, config: SocialAuthConfig): Promise<{ accessToken: string }>

  /** Create a post on the platform */
  createPost(post: SocialPost, accessToken: string): Promise<{ postId: string; url: string }>

  /** Get post analytics */
  getPostAnalytics(postId: string, accessToken: string): Promise<{
    impressions: number
    likes: number
    comments: number
    shares: number
  }>

  /** Validate access token */
  validateToken(accessToken: string): Promise<boolean>
}

/**
 * Example implementation:
 *
 * export class TwitterPlugin implements SocialPlatformPlugin {
 *   platformId = 'twitter'
 *   platformName = 'Twitter/X'
 *
 *   async getAuthUrl(config: SocialAuthConfig) {
 *     const params = new URLSearchParams({
 *       client_id: config.clientId,
 *       redirect_uri: config.redirectUri,
 *       scope: config.scopes.join(' '),
 *       response_type: 'code',
 *     })
 *     return `https://twitter.com/i/oauth2/authorize?${params}`
 *   }
 *
 *   async exchangeCode(code: string, config: SocialAuthConfig) {
 *     const response = await fetch('https://api.twitter.com/2/oauth2/token', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
 *       body: new URLSearchParams({
 *         code,
 *         grant_type: 'authorization_code',
 *         client_id: config.clientId,
 *         client_secret: config.clientSecret,
 *         redirect_uri: config.redirectUri,
 *       }),
 *     })
 *     const data = await response.json()
 *     return { accessToken: data.access_token, refreshToken: data.refresh_token }
 *   }
 *
 *   // ... implement other methods
 * }
 */
