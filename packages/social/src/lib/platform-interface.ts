// Platform-agnostic interface for social media clients
// Enables multi-platform support with consistent API

import type { SocialPlatform } from '../types/social-types'

export interface PostParams {
  content: string
  mediaUrls: string[]
  userId: string
  mediaType?: 'image' | 'video' | 'carousel'
}

export interface PlatformPostResponse {
  id: string
  url?: string
}

export interface PlatformInsights {
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export interface PlatformProfile {
  id: string
  username: string
  displayName?: string
}

export interface TokenRefreshResult {
  accessToken: string
  expiresIn: number
}

export interface SocialPlatformClient {
  platform: SocialPlatform
  post(params: PostParams): Promise<PlatformPostResponse>
  getPostInsights(postId: string): Promise<PlatformInsights>
  getUserProfile(userId: string): Promise<PlatformProfile>
  refreshToken(): Promise<TokenRefreshResult>
}

export interface PlatformConfig {
  maxContentLength: number
  maxMediaCount: number
  supportedMediaTypes: string[]
  hashtagSupport: boolean
}
