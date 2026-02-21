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
import { enqueueLinks, EnqueueStrategy } from './enqueue-links.js'
import { parseRobotsTxt, isAllowed as isRobotsAllowed } from '../discovery/robots-txt-parser.js'
import type { RobotsTxtRules } from '../types/crawler-types.js'
import { SessionPool } from '../stealth/session-pool.js'
import { StatePersister } from './state-persister.js'
import type { CrawlerState } from './state-persister.js'
import { ErrorTracker } from './error-tracker.js'
import { ErrorSnapshotter } from './error-snapshotter.js'

/**
 * Abstract base class for crawler engines.
 * Manages queue, concurrency, rate limiting, sessions, state persistence,
 * error tracking, and event emission.
 */
export abstract class CrawlerEngine {
  protected config: CrawlerEngineConfig
  protected events: CrawlerEventEmitter
  protected queue: PersistentRequestQueue
  protected pool: AutoscaledPool | null = null
  protected rateLimiter: DomainRateLimiter
  protected sessionPool: SessionPool
  protected statePersister: StatePersister
  protected errorTracker: ErrorTracker
  protected results: CrawlResult[] = []
  protected errors: Array<{ url: string; error: string }> = []
  protected inFlightCount = 0
  protected startTime = 0
  protected lastProcessedUrl: string | null = null
  protected robotsTxt: RobotsTxtRules | null = null

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
    this.sessionPool = new SessionPool()
    this.statePersister = new StatePersister()
    this.errorTracker = new ErrorTracker({}, new ErrorSnapshotter())
  }

  abstract handleRequest(request: CrawlRequest): Promise<CrawlResult>

  async run(seedUrls: string[]): Promise<CrawlRunResult> {
    this.startTime = Date.now()
    this.results = []
    this.errors = []

    // Fetch robots.txt for seed domain
    if (seedUrls.length > 0) {
      try {
        const seedOrigin = new URL(seedUrls[0]).origin
        const robotsResponse = await fetch(`${seedOrigin}/robots.txt`, {
          signal: AbortSignal.timeout(5000),
        })
        if (robotsResponse.ok) {
          this.robotsTxt = parseRobotsTxt(await robotsResponse.text())
        }
      } catch {
        // robots.txt not available — proceed without restrictions
      }
    }

    await this.queue.addRequests(
      seedUrls.map((url) => ({ url, depth: 0 }))
    )

    // Register shutdown hook for graceful state persistence
    this.statePersister.registerShutdownHook(async () => {
      await this.persistCurrentState()
    })

    // Start periodic state persistence (every 60s)
    this.statePersister.startPeriodicPersist(async () => {
      await this.persistCurrentState()
    })

    this.pool = new AutoscaledPool({
      minConcurrency: this.config.minConcurrency,
      maxConcurrency: this.config.maxConcurrency,
      taskFn: async () => this.processRequest(),
      isTaskReadyFn: async () => !(await this.queue.isEmpty()),
      isFinishedFn: async () =>
        (await this.queue.isEmpty()) && this.inFlightCount === 0,
    })

    await this.pool.run()

    this.statePersister.stopPeriodicPersist()

    const duration = Date.now() - this.startTime
    const stats = await this.queue.getStats()
    const result: CrawlRunResult = { stats, duration, errors: this.errors }
    this.events.emit('crawlFinished', result)
    return result
  }

  private async persistCurrentState(): Promise<void> {
    const stats = await this.queue.getStats()
    const state: CrawlerState = {
      queueId: `crawl-${this.startTime}`,
      lastProcessedUrl: this.lastProcessedUrl,
      phase: 'crawling',
      totalRequests: stats.total,
      completedRequests: stats.completed,
      failedRequests: stats.failed,
      timestamp: Date.now(),
    }
    await this.statePersister.persist(state, stats)
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
      this.lastProcessedUrl = request.url
      this.events.emit('requestCompleted', result)

      if (result.scrapedContent) {
        const { processedRequests } = enqueueLinks({
          urls: result.scrapedContent.links,
          baseUrl: request.url,
          strategy: this.config.sameDomainOnly
            ? EnqueueStrategy.SameDomain
            : EnqueueStrategy.All,
          exclude: ['*/admin/*', '*/login*', /\.(pdf|zip|exe|dmg|tar\.gz)$/i],
          robotsTxt: this.robotsTxt ?? undefined,
          onSkippedRequest: ({ url, reason }) => {
            this.events.emit('requestFailed', { url, uniqueKey: url, retryCount: 0, maxRetries: 0 } as CrawlRequest, new Error(`Skipped: ${reason}`))
          },
        })

        if (processedRequests.length > 0) {
          await this.queue.addRequests(
            processedRequests.map((req) => ({
              ...req,
              depth: (request.depth ?? 0) + 1,
            }))
          )
        }
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      this.events.emit('requestFailed', request, errorObj)
      this.errors.push({ url: request.url, error: errorObj.message })
      await this.queue.markFailed(request.uniqueKey)

      // Track error for grouping + snapshots
      await this.errorTracker.add(errorObj, { url: request.url })
    } finally {
      this.inFlightCount--
    }
  }
}
