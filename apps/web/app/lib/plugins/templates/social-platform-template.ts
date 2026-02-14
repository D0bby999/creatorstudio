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
  platformId: string
  platformName: string
  getAuthUrl(config: SocialAuthConfig): Promise<string>
  exchangeCode(code: string, config: SocialAuthConfig): Promise<{ accessToken: string; refreshToken?: string }>
  refreshToken(refreshToken: string, config: SocialAuthConfig): Promise<{ accessToken: string }>
  createPost(post: SocialPost, accessToken: string): Promise<{ postId: string; url: string }>
  getPostAnalytics(postId: string, accessToken: string): Promise<{
    impressions: number
    likes: number
    comments: number
    shares: number
  }>
  validateToken(accessToken: string): Promise<boolean>
}
