import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DomainRateLimiter } from '../src/lib/rate-limiter'

describe('DomainRateLimiter', () => {
  let limiter: DomainRateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should allow first request', () => {
    limiter = new DomainRateLimiter({ maxPerMinute: 10, maxConcurrent: 1 })
    expect(limiter.canRequest('example.com')).toBe(true)
  })

  it('should block requests after maxPerMinute reached', () => {
    limiter = new DomainRateLimiter({ maxPerMinute: 3, maxConcurrent: 1 })

    limiter.recordRequest('example.com')
    limiter.recordRequest('example.com')
    limiter.recordRequest('example.com')

    expect(limiter.canRequest('example.com')).toBe(false)
  })

  it('should allow requests after old timestamps expire (60s)', () => {
    limiter = new DomainRateLimiter({ maxPerMinute: 2, maxConcurrent: 1 })

    limiter.recordRequest('example.com')
    limiter.recordRequest('example.com')

    expect(limiter.canRequest('example.com')).toBe(false)

    // Advance time by 61 seconds
    vi.advanceTimersByTime(61000)

    expect(limiter.canRequest('example.com')).toBe(true)
  })

  it('should handle maxPerMinute=0 (always blocked)', () => {
    limiter = new DomainRateLimiter({ maxPerMinute: 0, maxConcurrent: 1 })
    expect(limiter.canRequest('example.com')).toBe(false)
  })

  it('should track different domains separately', () => {
    limiter = new DomainRateLimiter({ maxPerMinute: 2, maxConcurrent: 1 })

    limiter.recordRequest('example.com')
    limiter.recordRequest('example.com')
    limiter.recordRequest('other.com')

    expect(limiter.canRequest('example.com')).toBe(false)
    expect(limiter.canRequest('other.com')).toBe(true)
  })

  it('should reset all tracking data', () => {
    limiter = new DomainRateLimiter({ maxPerMinute: 1, maxConcurrent: 1 })

    limiter.recordRequest('example.com')
    expect(limiter.canRequest('example.com')).toBe(false)

    limiter.reset()
    expect(limiter.canRequest('example.com')).toBe(true)
  })

  it('should wait for slot to become available', async () => {
    limiter = new DomainRateLimiter({ maxPerMinute: 1, maxConcurrent: 1 })

    limiter.recordRequest('example.com')

    const waitPromise = limiter.waitForSlot('example.com')

    // Advance time in small increments to simulate polling
    vi.advanceTimersByTime(100)
    vi.advanceTimersByTime(100)

    // After 61s total, slot should be available
    vi.advanceTimersByTime(60800)

    await waitPromise // Should resolve without error
  })

  it('should throw error if wait timeout exceeded (30s)', async () => {
    limiter = new DomainRateLimiter({ maxPerMinute: 1, maxConcurrent: 1 })

    limiter.recordRequest('example.com')

    const waitPromise = limiter.waitForSlot('example.com')

    // Advance time beyond 30s timeout
    vi.advanceTimersByTime(31000)

    await expect(waitPromise).rejects.toThrow('Rate limit wait timeout')
  })
})
