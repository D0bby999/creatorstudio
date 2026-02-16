import type {
  CrawlRequest,
  CrawlResult,
  CrawlerEngineConfig,
  CrawlRunResult,
  CrawlerEvent,
} from '../types/crawler-types.js'
import { CrawlerEventEmitter } from './crawler-events.js'
import { PersistentRequestQueue } from '../queue/persistent-request-queue.js'
import { AutoscaledPool } from '../pool/autoscaled-pool.js'
import { DomainRateLimiter } from '../lib/rate-limiter.js'
import { createQueueStrategy } from '../queue/queue-strategy.js'
import { mergeConfig } from './crawler-config.js'
import { filterDiscoveredLinks } from './link-filter.js'

/**
 * Abstract base class for crawler engines.
 * Manages queue, concurrency, rate limiting, and event emission.
 * Subclasses implement handleRequest() for HTTP vs Browser strategies.
 */
export abstract class CrawlerEngine {
  protected config: CrawlerEngineConfig
  protected events: CrawlerEventEmitter
  protected queue: PersistentRequestQueue
  protected pool: AutoscaledPool | null = null
  protected rateLimiter: DomainRateLimiter
  protected results: CrawlResult[] = []
  protected errors: Array<{ url: string; error: string }> = []
  protected inFlightCount = 0
  protected startTime = 0

  constructor(config: Partial<CrawlerEngineConfig> = {}) {
    this.config = mergeConfig(config)
    this.events = new CrawlerEventEmitter()
    const strategy = createQueueStrategy(this.config.queueStrategy)
    this.queue = new PersistentRequestQueue({
      queueId: `crawl-${Date.now()}`,
      strategy,
    })
    this.rateLimiter = new DomainRateLimiter({
      maxPerMinute: this.config.rateLimitPerDomain,
      maxConcurrent: this.config.maxConcurrency,
    })
  }

  abstract handleRequest(request: CrawlRequest): Promise<CrawlResult>

  async run(seedUrls: string[]): Promise<CrawlRunResult> {
    this.startTime = Date.now()
    this.results = []
    this.errors = []

    await this.queue.addRequests(
      seedUrls.map((url) => ({ url, depth: 0 }))
    )

    this.pool = new AutoscaledPool({
      minConcurrency: this.config.minConcurrency,
      maxConcurrency: this.config.maxConcurrency,
      taskFn: async () => this.processRequest(),
      isTaskReadyFn: async () => !(await this.queue.isEmpty()),
      isFinishedFn: async () =>
        (await this.queue.isEmpty()) && this.inFlightCount === 0,
    })

    await this.pool.run()

    const duration = Date.now() - this.startTime
    const stats = await this.queue.getStats()
    const result: CrawlRunResult = { stats, duration, errors: this.errors }
    this.events.emit('crawlFinished', result)
    return result
  }

  async stop(): Promise<void> {
    if (this.pool) await this.pool.stop()
  }

  async pause(): Promise<void> {
    if (this.pool) await this.pool.pause()
  }

  async resume(): Promise<void> {
    if (this.pool) await this.pool.resume()
  }

  on(event: CrawlerEvent, listener: (...args: any[]) => void): this {
    this.events.on(event, listener)
    return this
  }

  getResults(): CrawlResult[] {
    return this.results
  }

  protected async processRequest(): Promise<void> {
    const request = await this.queue.fetchNextRequest()
    if (!request) return

    this.inFlightCount++
    try {
      const domain = new URL(request.url).hostname
      await this.rateLimiter.waitForSlot(domain)
      this.rateLimiter.recordRequest(domain)
      this.events.emit('requestStarted', request)

      const result = await this.handleRequest(request)
      await this.queue.markCompleted(request.uniqueKey)
      this.results.push(result)
      this.events.emit('requestCompleted', result)

      if (result.scrapedContent) {
        const validLinks = filterDiscoveredLinks(
          result.scrapedContent.links,
          request,
          this.config
        )
        if (validLinks.length > 0) {
          await this.queue.addRequests(
            validLinks.map((url) => ({
              url,
              depth: (request.depth ?? 0) + 1,
            }))
          )
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.events.emit('requestFailed', request, error as Error)
      this.errors.push({ url: request.url, error: errorMessage })
      await this.queue.markFailed(request.uniqueKey)
    } finally {
      this.inFlightCount--
    }
  }
}
