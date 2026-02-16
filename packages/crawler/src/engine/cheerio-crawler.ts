import { CrawlerEngine } from './crawler-engine.js'
import { scrapeUrl } from '../lib/url-scraper.js'
import type { CrawlRequest, CrawlResult, CrawlerEngineConfig } from '../types/crawler-types.js'

/**
 * Cheerio-based crawler for static HTML content
 * Fast and lightweight, ideal for server-rendered pages
 */
export class CheerioCrawler extends CrawlerEngine {
  constructor(config?: Partial<CrawlerEngineConfig>) {
    super(config)
  }

  /**
   * Handle request using Cheerio for HTML parsing
   * @param request - Crawl request to process
   * @returns Crawl result with scraped content
   */
  async handleRequest(request: CrawlRequest): Promise<CrawlResult> {
    // Extract session data from request if available
    const session = {
      cookies: request.headers?.['Cookie'],
      userAgent: request.headers?.['User-Agent'],
    }

    // Scrape URL with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.requestTimeoutMs
    )

    try {
      // Fetch the page
      const response = await fetch(request.url, {
        method: request.method ?? 'GET',
        headers: request.headers ?? {},
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Get response headers
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const contentType = response.headers.get('content-type') ?? 'text/html'
      const body = await response.text()

      // Scrape content using existing scrapeUrl logic
      const scrapedContent = await scrapeUrl(request.url, session)

      return {
        url: request.url,
        statusCode: response.status,
        body,
        headers: responseHeaders,
        contentType,
        scrapedContent,
        request,
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout: ${request.url} took longer than ${this.config.requestTimeoutMs}ms`)
      }

      throw error
    }
  }
}
