import type {
  FacebookCookies,
  FacebookScraperConfig,
  FacebookScraperStrategy,
  FacebookScrapeResult,
} from './facebook-types.js'
import { FacebookMbasicScraper } from './facebook-mbasic-scraper.js'
import { FacebookGraphQLScraper } from './facebook-graphql-scraper.js'

export interface ScrapeFacebookPageOptions {
  strategy?: FacebookScraperStrategy
  cookies?: FacebookCookies
  maxPosts?: number
  maxPages?: number
  requestDelayMs?: number
  proxy?: string
}

export async function scrapeFacebookPage(
  pageUrl: string,
  options?: ScrapeFacebookPageOptions
): Promise<FacebookScrapeResult> {
  const strategy = options?.strategy ?? 'auto'
  const config: Partial<FacebookScraperConfig> = {
    maxPosts: options?.maxPosts,
    maxPages: options?.maxPages,
    requestDelayMs: options?.requestDelayMs,
    proxy: options?.proxy,
    cookies: options?.cookies,
  }

  if (strategy === 'graphql') {
    if (!options?.cookies) {
      throw new Error('GraphQL strategy requires cookies (c_user + xs)')
    }
    return new FacebookGraphQLScraper(config).scrapePagePosts(pageUrl, options.cookies, config)
  }

  if (strategy === 'mbasic') {
    return new FacebookMbasicScraper(config).scrapePagePosts(pageUrl, config)
  }

  // 'auto' strategy: try graphql if cookies provided, fallback to mbasic
  if (options?.cookies) {
    try {
      const result = await new FacebookGraphQLScraper(config).scrapePagePosts(
        pageUrl, options.cookies, config
      )
      if (result.posts.length > 0) return result
      // GraphQL returned 0 posts — fallback
      console.warn('[scrapeFacebookPage] GraphQL returned 0 posts, falling back to mbasic')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[scrapeFacebookPage] GraphQL failed (${msg}), falling back to mbasic`)
    }
  }

  return new FacebookMbasicScraper(config).scrapePagePosts(pageUrl, config)
}
