import { CrawlerEngine } from './crawler-engine.js'
import { scrapeWithBrowser } from '../lib/browserless-scraper.js'
import type { CrawlRequest, CrawlResult, CrawlerEngineConfig } from '../types/crawler-types.js'

/**
 * Browser-based crawler using Browserless.io and Puppeteer
 * Handles JavaScript-heavy sites requiring full browser rendering
 */
export class BrowserCrawler extends CrawlerEngine {
  constructor(config?: Partial<CrawlerEngineConfig>) {
    super(config)
  }

  /**
   * Handle request using headless browser
   * @param request - Crawl request to process
   * @returns Crawl result with scraped content
   */
  async handleRequest(request: CrawlRequest): Promise<CrawlResult> {
    try {
      // Scrape using browserless with timeout config
      const scrapedContent = await scrapeWithBrowser(request.url, {
        timeout: this.config.requestTimeoutMs,
      })

      // Browser scraping doesn't expose raw response data
      // Return minimal valid CrawlResult structure
      return {
        url: request.url,
        statusCode: 200, // Assume success if no error thrown
        body: '', // Body not available in browser mode
        headers: {},
        contentType: 'text/html',
        scrapedContent,
        request,
      }
    } catch (error) {
      // Re-throw with context
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Browser crawl failed for ${request.url}: ${message}`)
    }
  }
}
