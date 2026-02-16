import type { CrawlRequest, QueueStats } from '../types/crawler-types.js'
import type { QueueStrategy } from './queue-strategy.js'

interface InMemoryItem {
  score: number
  request: CrawlRequest
}

/**
 * In-memory fallback queue implementation
 * Used when Redis is unavailable
 */
export class InMemoryQueue {
  private queue: InMemoryItem[] = []
  private data = new Map<string, CrawlRequest>()
  private completed = new Set<string>()
  private failed = new Set<string>()
  private insertionCounter = 0
  private strategy: QueueStrategy

  constructor(strategy: QueueStrategy) {
    this.strategy = strategy
  }

  wasAlreadyProcessed(uniqueKey: string): boolean {
    return (
      this.completed.has(uniqueKey) ||
      this.failed.has(uniqueKey) ||
      this.data.has(uniqueKey)
    )
  }

  addRequest(request: CrawlRequest): void {
    const score = this.strategy.getScore(this.insertionCounter++)
    this.queue.push({ score, request })
    this.queue.sort((a, b) => a.score - b.score)
    this.data.set(request.uniqueKey, request)
  }

  fetchNext(): CrawlRequest | null {
    if (this.queue.length === 0) return null
    const item = this.queue.shift()!
    return item.request
  }

  markCompleted(uniqueKey: string): void {
    this.completed.add(uniqueKey)
    this.data.delete(uniqueKey)
  }

  markFailed(uniqueKey: string): void {
    this.failed.add(uniqueKey)
    this.data.delete(uniqueKey)
  }

  getStats(): QueueStats {
    return {
      pending: this.queue.length,
      completed: this.completed.size,
      failed: this.failed.size,
      total: this.queue.length + this.completed.size + this.failed.size,
    }
  }

  isEmpty(): boolean {
    return this.queue.length === 0
  }
}
