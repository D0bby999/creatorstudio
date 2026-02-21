import type { TikTokScraperConfig, TikTokScrapeResult } from './tiktok-types.js'
import { TikTokWebScraper } from './tiktok-web-scraper.js'
import { TikTokEmbedScraper } from './tiktok-embed-scraper.js'
import { extractVideoId, isTikTokUrl } from './tiktok-url-utils.js'

export interface ScrapeTikTokOptions {
  maxVideos?: number
  requestDelayMs?: number
  proxy?: string
}

/**
 * Factory function to scrape TikTok profiles or videos
 * Strategy: Try web scraper first (for full profile data), fallback to oEmbed for individual videos
 */
export async function scrapeTikTok(
  url: string,
  options?: ScrapeTikTokOptions
): Promise<TikTokScrapeResult> {
  if (!isTikTokUrl(url)) {
    throw new Error(`Invalid TikTok URL: URL must be a tiktok.com domain`)
  }

  const config: Partial<TikTokScraperConfig> = {
    maxVideos: options?.maxVideos,
    requestDelayMs: options?.requestDelayMs,
    proxy: options?.proxy,
  }

  const videoId = extractVideoId(url)

  // If it's a video URL, try web scraper first then fallback to oEmbed
  if (videoId) {
    try {
      const webScraper = new TikTokWebScraper(config)
      const result = await webScraper.scrapeProfile(url)
      if (result.videos.length > 0) return result
      console.warn('[scrapeTikTok] Web scraper returned 0 videos, falling back to oEmbed')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[scrapeTikTok] Web scraper failed (${msg}), falling back to oEmbed`)
    }

    // Fallback to oEmbed for individual video
    return new TikTokEmbedScraper(config).scrapeVideo(url)
  }

  // For profile URLs, only web scraper is supported
  return new TikTokWebScraper(config).scrapeProfile(url)
}
