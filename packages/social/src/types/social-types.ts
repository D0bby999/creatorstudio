// Social platform types for multi-platform support

export type SocialPlatform = 'instagram' | 'twitter' | 'linkedin' | 'bluesky' | 'facebook' | 'threads' | 'tiktok'

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'

export interface SocialAccountData {
  id: string
  platform: SocialPlatform
  platformUserId: string
  username: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  tokenRefreshedAt?: Date
  scopesGranted: string[]
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
  parentPostId?: string
  postGroupId?: string
  failureReason?: string
  retryCount: number
  socialAccountId: string
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsSnapshot {
  date: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
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
  snapshots: AnalyticsSnapshot[]
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

// Content adaptation types
export interface ContentRules {
  maxChars: number
  maxHashtags: number
  linkChars: number
  mentionPrefix: string
}

export interface AdaptedContent {
  content: string
  platform: SocialPlatform
  warnings: ContentWarning[]
  metadata: {
    characterCount: number
    hashtagCount: number
    mentionCount: number
    linkCount: number
    truncated: boolean
  }
}

export type ContentWarning =
  | { type: 'truncated'; originalLength: number; maxLength: number }
  | { type: 'hashtags_stripped'; removed: string[]; maxAllowed: number }
  | { type: 'links_counted_as_shortened'; platform: string; charsPer: number }

// Threading types
export interface ThreadParams {
  posts: Array<{ content: string; mediaUrls: string[] }>
  platform: SocialPlatform
  socialAccountId: string
  scheduledAt?: Date
}
