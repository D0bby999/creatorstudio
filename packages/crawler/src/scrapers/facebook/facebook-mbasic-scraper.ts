import { UserAgentPool } from '../../stealth/user-agent-pool.js'
import { DomainRateLimiter } from '../../lib/rate-limiter.js'
import { withRetry } from '../../lib/retry-handler.js'
import { getStealthHeaders } from '../../stealth/stealth-headers.js'
import type { FacebookScraperConfig, FacebookScrapeResult, FacebookPost } from './facebook-types.js'
import { DEFAULT_FB_SCRAPER_CONFIG, buildCookieHeader } from './facebook-types.js'
import { normalizeToMbasicUrl, extractPageIdentifier } from './facebook-url-utils.js'
import { parsePostsFromHtml, findNextPageUrl } from './facebook-post-parser.js'
import * as cheerio from 'cheerio'

const MBASIC_DOMAIN = 'mbasic.facebook.com'

export class FacebookMbasicScraper {
  private userAgentPool = new UserAgentPool()
  private rateLimiter: DomainRateLimiter
  private config: FacebookScraperConfig

  constructor(config?: Partial<FacebookScraperConfig>) {
    this.config = { ...DEFAULT_FB_SCRAPER_CONFIG, ...config }
    // Conservative: ~12 req/min for mbasic
    this.rateLimiter = new DomainRateLimiter({ maxPerMinute: 12, maxConcurrent: 1 })
  }

  async scrapePagePosts(
    pageUrl: string,
    options?: Partial<FacebookScraperConfig>
  ): Promise<FacebookScrapeResult> {
    const config = { ...this.config, ...options }
    const startedAt = new Date()
    const errors: string[] = []
    const allPosts: FacebookPost[] = []

    const mbasicUrl = normalizeToMbasicUrl(pageUrl)
    const pageId = extractPageIdentifier(pageUrl)
    let pageName = pageId
    let currentUrl: string | null = mbasicUrl
    let pagesVisited = 0

    while (currentUrl && pagesVisited < config.maxPages && allPosts.length < config.maxPosts) {
      pagesVisited++

      try {
        const html = await this.fetchPage(currentUrl, config)

        // Extract page name from first page
        if (pagesVisited === 1) {
          const $ = cheerio.load(html)
          pageName = $('title').text().trim() || $('h1').text().trim() || pageId
        }

        const posts = parsePostsFromHtml(html, pageId)
        const remaining = config.maxPosts - allPosts.length
        allPosts.push(...posts.slice(0, remaining))

        if (allPosts.length >= config.maxPosts) break

        const $ = cheerio.load(html)
        currentUrl = findNextPageUrl($)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Page ${pagesVisited}: ${msg}`)
        break
      }

      // Delay between page fetches
      if (currentUrl) {
        await this.delay(config.requestDelayMs)
      }
    }

    return {
      pageUrl,
      pageName,
      posts: allPosts,
      totalScraped: allPosts.length,
      pagesVisited,
      errors,
      startedAt,
      completedAt: new Date(),
    }
  }

  private async fetchPage(url: string, config: FacebookScraperConfig): Promise<string> {
    await this.rateLimiter.waitForSlot(MBASIC_DOMAIN)

    const userAgent = this.userAgentPool.getAgentForDomain(MBASIC_DOMAIN, { deviceType: 'mobile' })
    const headers: Record<string, string> = {
      ...getStealthHeaders(url),
      'User-Agent': userAgent,
    }

    if (config.cookies) {
      headers['Cookie'] = buildCookieHeader(config.cookies)
    }

    const html = await withRetry(
      async () => {
        const response = await fetch(url, {
          headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.text()
      },
      2,
      3000
    )

    this.rateLimiter.recordRequest(MBASIC_DOMAIN)
    return html
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
