// Token bucket rate limiter with lazy refill and header parsing
// Serverless-compatible, in-memory state

export interface TokenBucketOptions {
  capacity: number
  refillRate: number // tokens per millisecond
  initialTokens?: number
}

export class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number
  private pending: Promise<void> = Promise.resolve()

  constructor(options: TokenBucketOptions) {
    this.capacity = options.capacity
    this.refillRate = options.refillRate
    this.tokens = options.initialTokens ?? options.capacity
    this.lastRefill = Date.now()
  }

  async acquire(count = 1): Promise<void> {
    // Serialize concurrent callers to prevent token underflow
    const prev = this.pending
    let resolve!: () => void
    this.pending = new Promise<void>((r) => { resolve = r })

    await prev

    try {
      this.refill()

      if (this.tokens >= count) {
        this.tokens -= count
        return
      }

      const deficit = count - this.tokens
      const waitMs = Math.ceil(deficit / this.refillRate)
      await new Promise<void>((r) => setTimeout(r, waitMs))

      this.refill()
      this.tokens -= count
    } finally {
      resolve()
    }
  }

  tryAcquire(count = 1): boolean {
    this.refill()
    if (this.tokens >= count) {
      this.tokens -= count
      return true
    }
    return false
  }

  getRemaining(): number {
    this.refill()
    return Math.floor(this.tokens)
  }

  updateFromHeaders(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining')
    if (remaining !== null) {
      const parsed = parseInt(remaining, 10)
      if (!isNaN(parsed)) {
        this.tokens = Math.min(parsed, this.capacity)
      }
    }

    const retryAfter = headers.get('retry-after')
    if (retryAfter !== null) {
      const seconds = parseInt(retryAfter, 10)
      if (!isNaN(seconds) && seconds > 0) {
        // Drain tokens to force waiting
        this.tokens = 0
        this.lastRefill = Date.now() + seconds * 1000
      }
    }
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    if (elapsed <= 0) return

    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate)
    this.lastRefill = now
  }
}
