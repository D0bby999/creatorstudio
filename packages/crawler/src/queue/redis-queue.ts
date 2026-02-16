import type { Redis } from '@upstash/redis'
import type { CrawlRequest, QueueStats } from '../types/crawler-types.js'
import type { QueueStrategy } from './queue-strategy.js'

/**
 * Redis-backed queue implementation
 * Uses sorted sets for priority ordering and hashes for request data
 */
export class RedisQueue {
  private redis: Redis
  private queueId: string
  private strategy: QueueStrategy
  private insertionCounter = 0

  constructor(redis: Redis, queueId: string, strategy: QueueStrategy) {
    this.redis = redis
    this.queueId = queueId
    this.strategy = strategy
  }

  private getKeys() {
    return {
      pending: `crawler:queue:${this.queueId}:pending`,
      data: `crawler:queue:${this.queueId}:data`,
      completed: `crawler:queue:${this.queueId}:completed`,
      failed: `crawler:queue:${this.queueId}:failed`,
      counter: `crawler:queue:${this.queueId}:counter`,
    }
  }

  async wasAlreadyProcessed(uniqueKey: string): Promise<boolean> {
    const keys = this.getKeys()
    const [inCompleted, inFailed, inPending] = await Promise.all([
      this.redis.sismember(keys.completed, uniqueKey),
      this.redis.sismember(keys.failed, uniqueKey),
      this.redis.hexists(keys.data, uniqueKey),
    ])
    return !!(inCompleted || inFailed || inPending)
  }

  async addRequest(request: CrawlRequest): Promise<void> {
    const keys = this.getKeys()
    const { uniqueKey } = request

    // Get insertion index and increment
    const insertionIndex = await this.redis.incr(keys.counter)
    const score = this.strategy.getScore(insertionIndex)

    // Add to queue
    await Promise.all([
      this.redis.zadd(keys.pending, { score, member: uniqueKey }),
      this.redis.hset(keys.data, { [uniqueKey]: JSON.stringify(request) }),
    ])
  }

  async fetchNext(): Promise<CrawlRequest | null> {
    const keys = this.getKeys()

    // Get lowest score item
    const items = await this.redis.zrange(keys.pending, 0, 0)
    if (!items || items.length === 0) return null

    const uniqueKey = String(items[0])
    const requestJson = await this.redis.hget(keys.data, uniqueKey)
    if (!requestJson) return null

    // Remove from pending
    await this.redis.zrem(keys.pending, uniqueKey)

    return JSON.parse(String(requestJson)) as CrawlRequest
  }

  async markCompleted(uniqueKey: string): Promise<void> {
    const keys = this.getKeys()
    await Promise.all([
      this.redis.sadd(keys.completed, uniqueKey),
      this.redis.hdel(keys.data, uniqueKey),
    ])
  }

  async markFailed(uniqueKey: string): Promise<void> {
    const keys = this.getKeys()
    await Promise.all([
      this.redis.sadd(keys.failed, uniqueKey),
      this.redis.hdel(keys.data, uniqueKey),
    ])
  }

  async getStats(): Promise<QueueStats> {
    const keys = this.getKeys()
    const [pending, completed, failed] = await Promise.all([
      this.redis.zcard(keys.pending),
      this.redis.scard(keys.completed),
      this.redis.scard(keys.failed),
    ])
    return {
      pending: pending ?? 0,
      completed: completed ?? 0,
      failed: failed ?? 0,
      total: (pending ?? 0) + (completed ?? 0) + (failed ?? 0),
    }
  }

  async isEmpty(): Promise<boolean> {
    const keys = this.getKeys()
    const count = await this.redis.zcard(keys.pending)
    return (count ?? 0) === 0
  }
}
