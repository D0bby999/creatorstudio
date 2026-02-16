import type { Redis } from '@upstash/redis'
import { getRedis } from '@creator-studio/redis'
import type {
  CrawlRequest,
  QueueStats,
  QueueOperationInfo,
  BatchOpts,
} from '../types/crawler-types.js'
import type { QueueStrategy } from './queue-strategy.js'
import { normalizeUniqueKey } from './normalize-unique-key.js'
import { InMemoryQueue } from './in-memory-queue.js'
import { RedisQueue } from './redis-queue.js'

/**
 * Persistent request queue with Redis backend and in-memory fallback
 * Features:
 * - Deduplication via uniqueKey
 * - BFS/DFS ordering via QueueStrategy
 * - Batch operations
 * - Completion/failure tracking
 */
export class PersistentRequestQueue {
  private queueId: string
  private strategy: QueueStrategy
  private redisQueue: RedisQueue | null = null
  private memoryQueue: InMemoryQueue | null = null

  constructor(config: {
    queueId: string
    strategy: QueueStrategy
    redis?: Redis
  }) {
    this.queueId = config.queueId
    this.strategy = config.strategy

    const redisClient = config.redis ?? getRedis()
    if (redisClient) {
      this.redisQueue = new RedisQueue(redisClient, config.queueId, config.strategy)
    } else {
      this.memoryQueue = new InMemoryQueue(config.strategy)
    }
  }

  /**
   * Add a single request to the queue
   * Returns info about whether it was already present
   */
  async addRequest(
    req: Partial<CrawlRequest> & { url: string }
  ): Promise<QueueOperationInfo> {
    const uniqueKey = normalizeUniqueKey(req.url)
    const crawlRequest: CrawlRequest = {
      url: req.url,
      method: req.method ?? 'GET',
      headers: req.headers ?? {},
      userData: req.userData ?? {},
      uniqueKey,
      retryCount: req.retryCount ?? 0,
      maxRetries: req.maxRetries ?? 3,
      noRetry: req.noRetry ?? false,
      label: req.label,
      depth: req.depth ?? 0,
    }

    if (this.redisQueue) {
      const wasPresent = await this.redisQueue.wasAlreadyProcessed(uniqueKey)
      if (wasPresent) {
        return { wasAlreadyPresent: true, uniqueKey }
      }
      await this.redisQueue.addRequest(crawlRequest)
      return { wasAlreadyPresent: false, uniqueKey }
    }

    // Memory fallback
    const wasPresent = this.memoryQueue!.wasAlreadyProcessed(uniqueKey)
    if (wasPresent) {
      return { wasAlreadyPresent: true, uniqueKey }
    }
    this.memoryQueue!.addRequest(crawlRequest)
    return { wasAlreadyPresent: false, uniqueKey }
  }

  /**
   * Add multiple requests in batches (blocking)
   * Processes all requests before returning
   */
  async addRequests(
    reqs: Array<Partial<CrawlRequest> & { url: string }>,
    maxBatch = 25
  ): Promise<QueueOperationInfo[]> {
    const results: QueueOperationInfo[] = []
    for (let i = 0; i < reqs.length; i += maxBatch) {
      const batch = reqs.slice(i, i + maxBatch)
      const batchResults = await Promise.all(batch.map((r) => this.addRequest(r)))
      results.push(...batchResults)
    }
    return results
  }

  /**
   * Add multiple requests in batches (non-blocking)
   * Returns after first batch, continues processing in background
   */
  async addRequestsBatched(
    reqs: Array<Partial<CrawlRequest> & { url: string }>,
    opts?: BatchOpts
  ): Promise<void> {
    const batchSize = opts?.batchSize ?? 25
    const waitMs = opts?.waitBetweenBatchesMillis ?? 0

    // Process first batch immediately
    const firstBatch = reqs.slice(0, batchSize)
    await Promise.all(firstBatch.map((r) => this.addRequest(r)))

    // Process remaining batches in background
    if (reqs.length > batchSize) {
      setImmediate(async () => {
        for (let i = batchSize; i < reqs.length; i += batchSize) {
          const batch = reqs.slice(i, i + batchSize)
          await Promise.all(batch.map((r) => this.addRequest(r)))
          if (waitMs > 0 && i + batchSize < reqs.length) {
            await new Promise((resolve) => setTimeout(resolve, waitMs))
          }
        }
      })
    }
  }

  /**
   * Fetch the next request from the queue
   */
  async fetchNextRequest(): Promise<CrawlRequest | null> {
    if (this.redisQueue) {
      return this.redisQueue.fetchNext()
    }
    return this.memoryQueue!.fetchNext()
  }

  /**
   * Mark a request as successfully completed
   */
  async markCompleted(uniqueKey: string): Promise<void> {
    if (this.redisQueue) {
      await this.redisQueue.markCompleted(uniqueKey)
    } else {
      this.memoryQueue!.markCompleted(uniqueKey)
    }
  }

  /**
   * Mark a request as failed
   */
  async markFailed(uniqueKey: string): Promise<void> {
    if (this.redisQueue) {
      await this.redisQueue.markFailed(uniqueKey)
    } else {
      this.memoryQueue!.markFailed(uniqueKey)
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    if (this.redisQueue) {
      return this.redisQueue.getStats()
    }
    return this.memoryQueue!.getStats()
  }

  /**
   * Check if queue is empty
   */
  async isEmpty(): Promise<boolean> {
    if (this.redisQueue) {
      return this.redisQueue.isEmpty()
    }
    return this.memoryQueue!.isEmpty()
  }
}
