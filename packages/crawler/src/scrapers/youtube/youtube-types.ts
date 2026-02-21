export interface YouTubeChannel {
  id: string
  name: string
  description: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  customUrl: string | null
  thumbnailUrl: string
  bannerUrl: string | null
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: Date
  thumbnailUrl: string
  duration: string
  channelId: string
}

export interface YouTubeScraperConfig {
  maxVideos: number
  requestDelayMs: number
  apiKey?: string
  proxy?: string
}

export interface YouTubeScrapeResult {
  channelUrl: string
  channel: YouTubeChannel | null
  videos: YouTubeVideo[]
  totalScraped: number
  errors: string[]
  source: 'innertube' | 'data-api'
  startedAt: Date
  completedAt: Date
}

export const DEFAULT_YT_CONFIG: YouTubeScraperConfig = {
  maxVideos: 12,
  requestDelayMs: 1000,
}
