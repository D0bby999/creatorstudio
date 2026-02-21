export interface InstagramProfile {
  username: string
  fullName: string
  bio: string
  followerCount: number
  followingCount: number
  postCount: number
  isVerified: boolean
  profilePicUrl: string
  externalUrl: string | null
}

export interface InstagramPost {
  id: string
  shortcode: string
  caption: string
  likeCount: number
  commentCount: number
  timestamp: Date
  mediaUrls: string[]
  isVideo: boolean
  videoUrl: string | null
}

export interface InstagramScraperConfig {
  maxPosts: number
  requestDelayMs: number
  proxy?: string
}

export interface InstagramScrapeResult {
  profileUrl: string
  profile: InstagramProfile | null
  posts: InstagramPost[]
  totalScraped: number
  errors: string[]
  source: 'mobile' | 'graphql'
  startedAt: Date
  completedAt: Date
}

export const DEFAULT_IG_CONFIG: InstagramScraperConfig = {
  maxPosts: 12,
  requestDelayMs: 3000,
}
