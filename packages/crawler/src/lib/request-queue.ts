import type { RequestQueueItem } from '../types/crawler-types'

/**
 * Priority queue for managing crawl requests
 * Items are dequeued in priority order (higher first), FIFO within same priority
 */
export class RequestQueue {
  private items: RequestQueueItem[] = []
  private completed = new Map<string, RequestQueueItem>()
  private failed = new Map<string, { item: RequestQueueItem; error: string }>()

  /**
   * Add item to queue, sorted by priority (higher first), FIFO within same priority
   */
  enqueue(item: RequestQueueItem): void {
    // Find insertion point - maintain descending priority order
    let insertIndex = this.items.length
    for (let i = 0; i < this.items.length; i++) {
      if (item.priority > this.items[i].priority) {
        insertIndex = i
        break
      }
    }
    this.items.splice(insertIndex, 0, item)
  }

  /**
   * Remove and return highest priority item (or null if empty)
   */
  dequeue(): RequestQueueItem | null {
    return this.items.shift() ?? null
  }

  /**
   * Return highest priority item without removing
   */
  peek(): RequestQueueItem | null {
    return this.items[0] ?? null
  }

  /**
   * Get number of pending items
   */
  size(): number {
    return this.items.length
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Mark URL as successfully completed
   */
  markCompleted(url: string): void {
    const item = this.items.find(i => i.url === url)
    if (item) {
      this.completed.set(url, item)
    }
  }

  /**
   * Mark URL as failed with error message
   */
  markFailed(url: string, error: string): void {
    const item = this.items.find(i => i.url === url)
    if (item) {
      this.failed.set(url, { item, error })
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): { pending: number; completed: number; failed: number } {
    return {
      pending: this.items.length,
      completed: this.completed.size,
      failed: this.failed.size,
    }
  }
}
