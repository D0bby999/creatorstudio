import { CrawlerEngine } from './crawler-engine.js'
import { scrapeUrl } from '../lib/url-scraper.js'
import { scrapeWithBrowser } from '../lib/browserless-scraper.js'
import type { CrawlRequest, CrawlResult, CrawlerEngineConfig } from '../types/crawler-types.js'

type RenderingType = 'static' | 'browser' | 'unknown'

/**
 * Smart crawler with adaptive rendering-type detection.
 * Samples a configurable ratio of requests (default 10%) to detect
 * whether a domain requires browser rendering or can use Cheerio.
 * Caches per-domain rendering type to avoid repeated detection.
 */
export class SmartCrawler extends CrawlerEngine {
  private domainRenderingCache = new Map<string, RenderingType>()
  private requestCount = 0

  constructor(config?: Partial<CrawlerEngineConfig>) {
    super(config)
  }

  async handleRequest(request: CrawlRequest): Promise<CrawlResult> {
    const domain = new URL(request.url).hostname
    const cached = this.domainRenderingCache.get(domain)
    this.requestCount++

    // Use cached rendering type if available
    if (cached === 'browser') {
      return this.fetchWithBrowser(request)
    }
    if (cached === 'static') {
      return this.fetchWithCheerio(request)
    }

    // Decide whether to sample this request for rendering detection
    const shouldSample =
      this.config.renderingTypeDetectionRatio > 0 &&
      Math.random() < this.config.renderingTypeDetectionRatio

    if (shouldSample) {
      return this.detectAndFetch(request, domain)
    }

    // Default: try Cheerio first, fallback to browser if content looks JS-rendered
    return this.fetchWithFallback(request, domain)
  }

  /** Fetch with Cheerio, detect JS rendering, fallback to browser if needed */
  private async fetchWithFallback(
    request: CrawlRequest,
    domain: string
  ): Promise<CrawlResult> {
    const result = await this.fetchWithCheerio(request)

    if (result.scrapedContent && this.looksJsRendered(result)) {
      // Check if browser is available
      if (!this.isBrowserAvailable()) {
        return result
      }
      const browserResult = await this.fetchWithBrowser(request)
      this.domainRenderingCache.set(domain, 'browser')
      return browserResult
    }

    return result
  }

  /** Sample: fetch with both Cheerio and browser, compare, cache result */
  private async detectAndFetch(
    request: CrawlRequest,
    domain: string
  ): Promise<CrawlResult> {
    const cheerioResult = await this.fetchWithCheerio(request)

    if (!this.isBrowserAvailable()) {
      this.domainRenderingCache.set(domain, 'static')
      return cheerioResult
    }

    const browserResult = await this.fetchWithBrowser(request)
    const renderingType = this.compareResults(cheerioResult, browserResult)
    this.domainRenderingCache.set(domain, renderingType)

    return renderingType === 'browser' ? browserResult : cheerioResult
  }

  private async fetchWithCheerio(request: CrawlRequest): Promise<CrawlResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs)

    try {
      const response = await fetch(request.url, {
        method: request.method ?? 'GET',
        headers: request.headers ?? {},
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const headers: Record<string, string> = {}
      response.headers.forEach((v, k) => { headers[k] = v })
      const body = await response.text()
      const scrapedContent = await scrapeUrl(request.url)

      return {
        url: request.url,
        statusCode: response.status,
        body,
        headers,
        contentType: response.headers.get('content-type') ?? 'text/html',
        scrapedContent,
        request,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout: ${request.url} exceeded ${this.config.requestTimeoutMs}ms`)
      }
      throw error
    }
  }

  private async fetchWithBrowser(request: CrawlRequest): Promise<CrawlResult> {
    const scrapedContent = await scrapeWithBrowser(request.url, {
      timeout: this.config.requestTimeoutMs,
    })
    return {
      url: request.url,
      statusCode: 200,
      body: '',
      headers: {},
      contentType: 'text/html',
      scrapedContent,
      request,
    }
  }

  /** Heuristic: content looks JS-rendered if very little text extracted */
  private looksJsRendered(result: CrawlResult): boolean {
    if (!result.scrapedContent) return false
    const text = result.scrapedContent.text
    if (text.length < 100) return true
    if (text.length < 500 && result.body.includes('<noscript>')) return true
    return false
  }

  /** Compare Cheerio vs browser results to determine rendering type */
  private compareResults(cheerio: CrawlResult, browser: CrawlResult): RenderingType {
    const cheerioLen = cheerio.scrapedContent?.text.length ?? 0
    const browserLen = browser.scrapedContent?.text.length ?? 0

    // If browser yields significantly more content, it's JS-rendered
    if (browserLen > cheerioLen * 1.5 && browserLen - cheerioLen > 200) {
      return 'browser'
    }
    return 'static'
  }

  private isBrowserAvailable(): boolean {
    return !!(process.env.BROWSERLESS_API_URL && process.env.BROWSERLESS_API_TOKEN)
  }
}
