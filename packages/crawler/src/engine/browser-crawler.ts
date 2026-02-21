import { CrawlerEngine } from './crawler-engine.js'
import { scrapeWithBrowser } from '../lib/browserless-scraper.js'
import type { CrawlRequest, CrawlResult, CrawlerEngineConfig } from '../types/crawler-types.js'

/**
 * Browser-based crawler with fingerprint injection via CDP
 * Handles JavaScript-heavy sites requiring full browser rendering
 */
export class BrowserCrawler extends CrawlerEngine {
  constructor(config?: Partial<CrawlerEngineConfig>) {
    super(config)
  }

  async handleRequest(request: CrawlRequest): Promise<CrawlResult> {
    const session = this.sessionPool.getSession(new URL(request.url).hostname)

    try {
      const scrapedContent = await scrapeWithBrowser(request.url, {
        timeout: this.config.requestTimeoutMs,
        fingerprintId: session.fingerprintId,
        fingerprintManager: this.sessionPool.getFingerprintManager(),
      })

      this.sessionPool.markGood(session.id)

      return {
        url: request.url,
        statusCode: 200,
        body: '',
        headers: {},
        contentType: 'text/html',
        scrapedContent,
        request,
      }
    } catch (error) {
      this.sessionPool.markBad(session.id)

      const message = error instanceof Error ? error.message : String(error)

      // Retire session on anti-bot detection
      if (message.includes('403') || message.includes('429')) {
        this.sessionPool.retire(session.id)
      }

      throw new Error(`Browser crawl failed for ${request.url}: ${message}`)
    }
  }
}
