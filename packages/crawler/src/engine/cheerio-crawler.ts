import { CrawlerEngine } from './crawler-engine.js'
import { scrapeUrl } from '../lib/url-scraper.js'
import { HttpClient } from '../lib/http-client.js'
import type { CrawlRequest, CrawlResult, CrawlerEngineConfig } from '../types/crawler-types.js'

const httpClient = new HttpClient()

/**
 * Cheerio-based crawler with fingerprint-aware HTTP/2 requests
 * Fast and lightweight, ideal for server-rendered pages
 */
export class CheerioCrawler extends CrawlerEngine {
  constructor(config?: Partial<CrawlerEngineConfig>) {
    super(config)
  }

  async handleRequest(request: CrawlRequest): Promise<CrawlResult> {
    const session = this.sessionPool.getSession(new URL(request.url).hostname)
    const fpManager = this.sessionPool.getFingerprintManager()
    const fingerprint = session.fingerprintId
      ? fpManager.get(session.fingerprintId)
      : undefined

    const requestHeaders: Record<string, string> = {
      ...(fingerprint?.headers ?? {}),
      ...(request.headers ?? {}),
    }

    try {
      const response = await httpClient.get(request.url, {
        headers: requestHeaders,
        timeout: this.config.requestTimeoutMs,
      })

      // Anti-bot detection: retire session on 403/429
      if (response.statusCode === 403 || response.statusCode === 429) {
        this.sessionPool.retire(session.id)
        throw new Error(`Anti-bot detected: HTTP ${response.statusCode}`)
      }

      const scrapedContent = await scrapeUrl(
        request.url,
        { cookies: request.headers?.['Cookie'], userAgent: fingerprint?.userAgent },
        fingerprint?.headers
      )

      this.sessionPool.markGood(session.id)

      return {
        url: request.url,
        statusCode: response.statusCode,
        body: response.body,
        headers: response.headers,
        contentType: response.headers['content-type'] ?? 'text/html',
        scrapedContent,
        request,
      }
    } catch (error) {
      this.sessionPool.markBad(session.id)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Request timeout: ${request.url} took longer than ${this.config.requestTimeoutMs}ms`
        )
      }
      throw error
    }
  }
}
