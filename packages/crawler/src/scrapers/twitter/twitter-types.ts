export interface TwitterProfile {
  handle: string
  name: string
  bio: string
  followerCount: number
  followingCount: number
  tweetCount: number
  isVerified: boolean
  profileImageUrl: string
  bannerUrl: string | null
}

export interface Tweet {
  id: string
  text: string
  likeCount: number
  retweetCount: number
  replyCount: number
  timestamp: Date
  mediaUrls: string[]
  isRetweet: boolean
}

export interface TwitterScraperConfig {
  maxTweets: number
  requestDelayMs: number
  proxy?: string
}

export interface TwitterScrapeResult {
  profileUrl: string
  profile: TwitterProfile | null
  tweets: Tweet[]
  totalScraped: number
  errors: string[]
  source: 'syndication' | 'guest-api'
  startedAt: Date
  completedAt: Date
}

export const DEFAULT_TWITTER_CONFIG: TwitterScraperConfig = {
  maxTweets: 20,
  requestDelayMs: 2000,
}
