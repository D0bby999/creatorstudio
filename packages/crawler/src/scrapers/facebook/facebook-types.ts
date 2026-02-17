export interface FacebookPost {
  postId: string
  permalink: string
  text: string
  author: string
  authorUrl: string | null
  timestamp: Date | null
  timestampRaw: string
  images: string[]
  videos: { thumbnailUrl: string; permalink: string }[]
  reactions: number
  comments: number
  shares: number | null
  reactionBreakdown?: FacebookReactionBreakdown
  scrapedAt: Date
  source: 'mbasic' | 'graphql'
}

export interface FacebookReactionBreakdown {
  like: number
  love: number
  haha: number
  wow: number
  sad: number
  angry: number
}

export interface FacebookScraperConfig {
  maxPosts: number
  maxPages: number
  requestDelayMs: number
  cookies?: FacebookCookies
  proxy?: string
}

export interface FacebookCookies {
  c_user: string
  xs: string
}

export interface FacebookScrapeResult {
  pageUrl: string
  pageName: string
  posts: FacebookPost[]
  totalScraped: number
  pagesVisited: number
  errors: string[]
  startedAt: Date
  completedAt: Date
}

export interface FacebookGraphQLTokens {
  fbDtsg: string
  lsd: string
  jazoest: string
  userId: string
}

export type FacebookScraperStrategy = 'mbasic' | 'graphql' | 'auto'

export const DEFAULT_FB_SCRAPER_CONFIG: FacebookScraperConfig = {
  maxPosts: 50,
  maxPages: 10,
  requestDelayMs: 5000,
}

// Validate cookies to prevent header injection (CRLF, semicolons in values)
const SAFE_COOKIE_VALUE = /^[a-zA-Z0-9%_+/=-]+$/

export function buildCookieHeader(cookies: FacebookCookies): string {
  if (!SAFE_COOKIE_VALUE.test(cookies.c_user) || !SAFE_COOKIE_VALUE.test(cookies.xs)) {
    throw new Error('Invalid cookie value — contains unsafe characters')
  }
  return `c_user=${cookies.c_user}; xs=${cookies.xs}`
}
