import type { ComponentType } from 'react'
import type { InstagramScrapeResult } from '../../scrapers/instagram/instagram-types.js'
import type { TwitterScrapeResult } from '../../scrapers/twitter/twitter-types.js'
import type { TikTokScrapeResult } from '../../scrapers/tiktok/tiktok-types.js'
import type { YouTubeScrapeResult } from '../../scrapers/youtube/youtube-types.js'

export interface SocialPlatformConfig {
  id: string
  name: string
  title: string
  description: string
  urlLabel: string
  urlPlaceholder: string
  itemLabel: string
  defaultMaxItems: number
  csvHeaders: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CardComponent: ComponentType<{ item: any }>
  getItems: (result: unknown) => Record<string, unknown>[]
  getErrors: (result: unknown) => string[]
  getSource: (result: unknown) => string
}

/** Validate image URL to prevent javascript: or data: XSS via img src */
export function safeImageUrl(url: string | undefined | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url
    return null
  } catch {
    return null
  }
}

export const instagramConfig: Omit<SocialPlatformConfig, 'CardComponent'> = {
  id: 'instagram',
  name: 'Instagram',
  title: 'Instagram Profile Scraper',
  description: 'Extract posts and reels from any public Instagram profile.',
  urlLabel: 'Instagram Profile URL',
  urlPlaceholder: 'https://instagram.com/username',
  itemLabel: 'posts',
  defaultMaxItems: 12,
  csvHeaders: ['id', 'shortcode', 'caption', 'likeCount', 'commentCount', 'timestamp', 'isVideo'],
  getItems: (r) => (r as InstagramScrapeResult).posts as unknown as Record<string, unknown>[],
  getErrors: (r) => (r as InstagramScrapeResult).errors,
  getSource: (r) => (r as InstagramScrapeResult).source,
}

export const twitterConfig: Omit<SocialPlatformConfig, 'CardComponent'> = {
  id: 'twitter',
  name: 'Twitter/X',
  title: 'Twitter/X Profile Scraper',
  description: 'Extract tweets from any public Twitter/X profile.',
  urlLabel: 'Twitter/X Profile URL',
  urlPlaceholder: 'https://x.com/username',
  itemLabel: 'tweets',
  defaultMaxItems: 20,
  csvHeaders: ['id', 'text', 'likeCount', 'retweetCount', 'replyCount', 'timestamp', 'isRetweet'],
  getItems: (r) => (r as TwitterScrapeResult).tweets as unknown as Record<string, unknown>[],
  getErrors: (r) => (r as TwitterScrapeResult).errors,
  getSource: (r) => (r as TwitterScrapeResult).source,
}

export const tiktokConfig: Omit<SocialPlatformConfig, 'CardComponent'> = {
  id: 'tiktok',
  name: 'TikTok',
  title: 'TikTok Profile Scraper',
  description: 'Extract videos and metadata from any public TikTok profile.',
  urlLabel: 'TikTok Profile URL',
  urlPlaceholder: 'https://tiktok.com/@username',
  itemLabel: 'videos',
  defaultMaxItems: 12,
  csvHeaders: ['id', 'description', 'viewCount', 'likeCount', 'commentCount', 'shareCount', 'timestamp'],
  getItems: (r) => (r as TikTokScrapeResult).videos as unknown as Record<string, unknown>[],
  getErrors: (r) => (r as TikTokScrapeResult).errors,
  getSource: (r) => (r as TikTokScrapeResult).source,
}

export const youtubeConfig: Omit<SocialPlatformConfig, 'CardComponent'> = {
  id: 'youtube',
  name: 'YouTube',
  title: 'YouTube Channel Scraper',
  description: 'Extract videos and metadata from any public YouTube channel.',
  urlLabel: 'YouTube Channel URL',
  urlPlaceholder: 'https://youtube.com/@channel',
  itemLabel: 'videos',
  defaultMaxItems: 12,
  csvHeaders: ['id', 'title', 'viewCount', 'likeCount', 'commentCount', 'publishedAt', 'duration'],
  getItems: (r) => (r as YouTubeScrapeResult).videos as unknown as Record<string, unknown>[],
  getErrors: (r) => (r as YouTubeScrapeResult).errors,
  getSource: (r) => (r as YouTubeScrapeResult).source,
}
