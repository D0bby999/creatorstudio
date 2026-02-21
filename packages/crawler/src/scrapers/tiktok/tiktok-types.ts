export interface TikTokProfile {
  username: string
  nickname: string
  bio: string
  followerCount: number
  followingCount: number
  likeCount: number
  isVerified: boolean
  avatarUrl: string
}

export interface TikTokVideo {
  id: string
  description: string
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number
  timestamp: Date
  videoUrl: string
  coverUrl: string
  musicTitle: string | null
}

export interface TikTokScraperConfig {
  maxVideos: number
  requestDelayMs: number
  proxy?: string
}

export interface TikTokScrapeResult {
  profileUrl: string
  profile: TikTokProfile | null
  videos: TikTokVideo[]
  totalScraped: number
  errors: string[]
  source: 'web' | 'embed'
  startedAt: Date
  completedAt: Date
}

export const DEFAULT_TIKTOK_CONFIG: TikTokScraperConfig = {
  maxVideos: 12,
  requestDelayMs: 3000,
}
