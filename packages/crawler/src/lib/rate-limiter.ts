import type { RateLimitConfig } from '../types/crawler-types'

/**
 * Rate limiter for managing requests per domain
 * Tracks timestamps to enforce maxPerMinute limit
 */
export class DomainRateLimiter {
  private config: RateLimitConfig
  private requests = new Map<string, number[]>()

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Check if a request can be made to domain
   * Cleans up timestamps older than 60s
   */
  canRequest(domain: string): boolean {
    const now = Date.now()
    const timestamps = this.requests.get(domain) || []

    // Filter out timestamps older than 60s
    const recent = timestamps.filter(ts => now - ts < 60000)
    this.requests.set(domain, recent)

    return recent.length < this.config.maxPerMinute
  }

  /**
   * Record a request timestamp for domain
   */
  recordRequest(domain: string): void {
    const now = Date.now()
    const timestamps = this.requests.get(domain) || []
    timestamps.push(now)
    this.requests.set(domain, timestamps)
  }

  /**
   * Wait until a request slot is available for domain
   * Polls every 100ms with 30s max wait
   */
  async waitForSlot(domain: string): Promise<void> {
    const startTime = Date.now()
    const maxWait = 30000 // 30s

    while (!this.canRequest(domain)) {
      if (Date.now() - startTime > maxWait) {
        throw new Error(`Rate limit wait timeout for domain: ${domain}`)
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /**
   * Clear all tracking data
   */
  reset(): void {
    this.requests.clear()
  }
}
