/** Offline operation queue for buffering changes when WebSocket disconnected */

export interface QueuedOperation {
  /** Unique operation identifier */
  id: string
  /** Operation type (diff, presence, etc.) */
  type: string
  /** Operation payload */
  data: unknown
  /** Timestamp when operation was queued */
  timestamp: number
}

export interface OfflineQueueConfig {
  /** Maximum queue size (default: 1000) */
  maxSize?: number
  /** TTL for operations in milliseconds (default: 5 minutes) */
  ttlMs?: number
}

export class OfflineQueue {
  private queue: QueuedOperation[] = []
  private readonly maxSize: number
  private readonly ttlMs: number

  constructor(config: OfflineQueueConfig = {}) {
    this.maxSize = config.maxSize ?? 1000
    this.ttlMs = config.ttlMs ?? 300_000 // 5 minutes
  }

  /** Enqueue operation, dropping oldest if at capacity */
  enqueue(type: string, data: unknown): void {
    const op: QueuedOperation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
    }

    // Remove expired operations
    this.removeExpired()

    // Drop oldest if at capacity
    if (this.queue.length >= this.maxSize) {
      this.queue.shift()
    }

    this.queue.push(op)
  }

  /** Flush all queued operations and clear queue */
  flush(): QueuedOperation[] {
    const ops = [...this.queue]
    this.queue = []
    return ops
  }

  /** Get queue size */
  size(): number {
    return this.queue.length
  }

  /** Clear all queued operations */
  clear(): void {
    this.queue = []
  }

  /** Remove expired operations based on TTL */
  private removeExpired(): void {
    const now = Date.now()
    this.queue = this.queue.filter(op => now - op.timestamp < this.ttlMs)
  }

  /** Peek at queued operations without removing them */
  peek(): ReadonlyArray<QueuedOperation> {
    return [...this.queue]
  }
}
