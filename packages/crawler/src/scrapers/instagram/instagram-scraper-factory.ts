import type { InstagramScraperConfig, InstagramScrapeResult } from './instagram-types.js'
import { InstagramMobileScraper } from './instagram-mobile-scraper.js'
import { InstagramGraphQLScraper } from './instagram-graphql-scraper.js'
import { isInstagramUrl } from './instagram-url-utils.js'

export interface ScrapeInstagramOptions {
  maxPosts?: number
  requestDelayMs?: number
  proxy?: string
}

export async function scrapeInstagram(
  url: string,
  options?: ScrapeInstagramOptions
): Promise<InstagramScrapeResult> {
  if (!isInstagramUrl(url)) {
    throw new Error(`Invalid Instagram URL: URL must be an instagram.com domain`)
  }

  const config: Partial<InstagramScraperConfig> = {
    maxPosts: options?.maxPosts,
    requestDelayMs: options?.requestDelayMs,
    proxy: options?.proxy,
  }

  // Try mobile strategy first (simpler, less likely to be blocked)
  try {
    const mobileResult = await new InstagramMobileScraper(config).scrapeProfile(url)
    if (mobileResult.posts.length > 0 || mobileResult.profile !== null) {
      return mobileResult
    }
    console.warn('[scrapeInstagram] Mobile strategy returned no data, falling back to GraphQL')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[scrapeInstagram] Mobile strategy failed (${msg}), falling back to GraphQL`)
  }

  // Fallback to GraphQL strategy
  return new InstagramGraphQLScraper(config).scrapeProfile(url)
}
