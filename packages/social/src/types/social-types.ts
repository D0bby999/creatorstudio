// Social platform types for multi-platform support

export type SocialPlatform = 'instagram' | 'twitter' | 'linkedin' | 'bluesky'

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'

export interface SocialAccountData {
  id: string
  platform: SocialPlatform
  platformUserId: string
  username: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface SocialPostData {
  id: string
  content: string
  mediaUrls: string[]
  platform: SocialPlatform
  scheduledAt?: Date
  publishedAt?: Date
  status: PostStatus
  platformPostId?: string
  socialAccountId: string
  createdAt: Date
  updatedAt: Date
}

export interface PostAnalyticsData {
  id: string
  postId: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  fetchedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface InstagramPostResponse {
  id: string
  permalink?: string
}

export interface InstagramInsights {
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export interface CreatePostInput {
  content: string
  mediaUrls: string[]
  scheduledAt?: Date
  socialAccountId: string
}

export interface ScheduledPostJob {
  postId: string
  socialAccountId: string
  scheduledAt: Date
}
