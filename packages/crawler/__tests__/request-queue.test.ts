import { describe, it, expect, beforeEach } from 'vitest'
import { RequestQueue } from '../src/lib/request-queue'
import type { RequestQueueItem } from '../src/types/crawler-types'

describe('RequestQueue', () => {
  let queue: RequestQueue

  beforeEach(() => {
    queue = new RequestQueue()
  })

  it('should enqueue and dequeue items by priority (higher first)', () => {
    const item1: RequestQueueItem = { url: 'https://a.com', priority: 1, retryCount: 0, maxRetries: 3 }
    const item2: RequestQueueItem = { url: 'https://b.com', priority: 3, retryCount: 0, maxRetries: 3 }
    const item3: RequestQueueItem = { url: 'https://c.com', priority: 2, retryCount: 0, maxRetries: 3 }

    queue.enqueue(item1)
    queue.enqueue(item2)
    queue.enqueue(item3)

    expect(queue.dequeue()?.url).toBe('https://b.com') // priority 3
    expect(queue.dequeue()?.url).toBe('https://c.com') // priority 2
    expect(queue.dequeue()?.url).toBe('https://a.com') // priority 1
  })

  it('should maintain FIFO order for same priority items', () => {
    const item1: RequestQueueItem = { url: 'https://first.com', priority: 5, retryCount: 0, maxRetries: 3 }
    const item2: RequestQueueItem = { url: 'https://second.com', priority: 5, retryCount: 0, maxRetries: 3 }
    const item3: RequestQueueItem = { url: 'https://third.com', priority: 5, retryCount: 0, maxRetries: 3 }

    queue.enqueue(item1)
    queue.enqueue(item2)
    queue.enqueue(item3)

    expect(queue.dequeue()?.url).toBe('https://first.com')
    expect(queue.dequeue()?.url).toBe('https://second.com')
    expect(queue.dequeue()?.url).toBe('https://third.com')
  })

  it('should return null when dequeuing from empty queue', () => {
    expect(queue.dequeue()).toBeNull()
  })

  it('should peek without removing item', () => {
    const item: RequestQueueItem = { url: 'https://test.com', priority: 1, retryCount: 0, maxRetries: 3 }
    queue.enqueue(item)

    expect(queue.peek()?.url).toBe('https://test.com')
    expect(queue.size()).toBe(1)
    expect(queue.peek()?.url).toBe('https://test.com') // Still there
  })

  it('should return correct size and isEmpty status', () => {
    expect(queue.isEmpty()).toBe(true)
    expect(queue.size()).toBe(0)

    queue.enqueue({ url: 'https://a.com', priority: 1, retryCount: 0, maxRetries: 3 })
    expect(queue.isEmpty()).toBe(false)
    expect(queue.size()).toBe(1)

    queue.enqueue({ url: 'https://b.com', priority: 2, retryCount: 0, maxRetries: 3 })
    expect(queue.size()).toBe(2)

    queue.dequeue()
    expect(queue.size()).toBe(1)
  })

  it('should track completed and failed items in stats', () => {
    const item1: RequestQueueItem = { url: 'https://success.com', priority: 1, retryCount: 0, maxRetries: 3 }
    const item2: RequestQueueItem = { url: 'https://failed.com', priority: 1, retryCount: 0, maxRetries: 3 }
    const item3: RequestQueueItem = { url: 'https://pending.com', priority: 1, retryCount: 0, maxRetries: 3 }

    queue.enqueue(item1)
    queue.enqueue(item2)
    queue.enqueue(item3)

    queue.markCompleted('https://success.com')
    queue.markFailed('https://failed.com', 'Network error')

    const stats = queue.getStats()
    expect(stats.pending).toBe(3) // Items not yet dequeued
    expect(stats.completed).toBe(1)
    expect(stats.failed).toBe(1)
  })
})
