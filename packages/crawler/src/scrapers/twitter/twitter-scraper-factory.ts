import type { TwitterScraperConfig, TwitterScrapeResult } from './twitter-types.js'
import { TwitterWebScraper } from './twitter-web-scraper.js'
import { TwitterGuestApiScraper } from './twitter-guest-api-scraper.js'
import { isTwitterUrl } from './twitter-url-utils.js'

export interface ScrapeTwitterOptions {
  maxTweets?: number
  requestDelayMs?: number
  proxy?: string
}

export async function scrapeTwitter(
  url: string,
  options?: ScrapeTwitterOptions
): Promise<TwitterScrapeResult> {
  if (!isTwitterUrl(url)) {
    throw new Error(`Invalid Twitter URL: URL must be a twitter.com or x.com domain`)
  }

  const config: Partial<TwitterScraperConfig> = {
    maxTweets: options?.maxTweets,
    requestDelayMs: options?.requestDelayMs,
    proxy: options?.proxy,
  }

  // Try syndication strategy first (simpler, no token needed)
  try {
    const syndicationResult = await new TwitterWebScraper(config).scrapeProfile(url)
    if (syndicationResult.tweets.length > 0 || syndicationResult.profile !== null) {
      return syndicationResult
    }
    console.warn('[scrapeTwitter] Syndication strategy returned no data, falling back to guest API')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[scrapeTwitter] Syndication strategy failed (${msg}), falling back to guest API`)
  }

  // Fallback to guest API strategy
  return new TwitterGuestApiScraper(config).scrapeProfile(url)
}
