import type { YouTubeScraperConfig, YouTubeScrapeResult } from './youtube-types.js'
import { YouTubeInnertubeScraper } from './youtube-innertube-scraper.js'
import { YouTubeDataApiScraper } from './youtube-data-api-scraper.js'
import { isYouTubeUrl } from './youtube-url-utils.js'

export interface ScrapeYouTubeOptions {
  maxVideos?: number
  requestDelayMs?: number
  apiKey?: string
  proxy?: string
}

/**
 * Factory function to scrape YouTube channels
 * Strategy: Try Innertube first (free, no API key needed), fallback to Data API v3 if apiKey provided
 */
export async function scrapeYouTube(
  channelUrl: string,
  options?: ScrapeYouTubeOptions
): Promise<YouTubeScrapeResult> {
  if (!isYouTubeUrl(channelUrl)) {
    throw new Error(`Invalid YouTube URL: URL must be a youtube.com domain`)
  }

  const config: Partial<YouTubeScraperConfig> = {
    maxVideos: options?.maxVideos,
    requestDelayMs: options?.requestDelayMs,
    apiKey: options?.apiKey,
    proxy: options?.proxy,
  }

  // Try Innertube first (free, no API key needed)
  try {
    const innertubeScraper = new YouTubeInnertubeScraper(config)
    const result = await innertubeScraper.scrapeChannel(channelUrl)
    if (result.videos.length > 0) return result
    console.warn('[scrapeYouTube] Innertube returned 0 videos, falling back to Data API')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[scrapeYouTube] Innertube failed (${msg}), falling back to Data API`)
  }

  // Fallback to Data API if apiKey is available
  if (options?.apiKey || config.apiKey || process.env.YOUTUBE_API_KEY) {
    return new YouTubeDataApiScraper(config).scrapeChannel(channelUrl, options?.apiKey)
  }

  throw new Error('YouTube scraping failed with Innertube and no API key provided for Data API fallback')
}
