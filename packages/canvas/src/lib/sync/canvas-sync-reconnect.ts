/** Exponential backoff reconnection strategy for WebSocket connections */

export interface ReconnectConfig {
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs?: number
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs?: number
  /** Maximum reconnection attempts (default: 5) */
  maxAttempts?: number
  /** Jitter factor 0-1 to randomize delay (default: 0.1) */
  jitterFactor?: number
}

export class ReconnectStrategy {
  private attempt = 0
  private readonly baseDelayMs: number
  private readonly maxDelayMs: number
  private readonly maxAttempts: number
  private readonly jitterFactor: number

  constructor(config: ReconnectConfig = {}) {
    this.baseDelayMs = config.baseDelayMs ?? 1000
    this.maxDelayMs = config.maxDelayMs ?? 30_000
    this.maxAttempts = config.maxAttempts ?? 5
    this.jitterFactor = config.jitterFactor ?? 0.1
  }

  /** Calculate next reconnection delay with exponential backoff + jitter */
  getNextDelay(): number | null {
    if (this.attempt >= this.maxAttempts) return null

    const exponentialDelay = this.baseDelayMs * Math.pow(2, this.attempt)
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs)

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * this.jitterFactor * (Math.random() * 2 - 1)
    const finalDelay = Math.max(0, cappedDelay + jitter)

    this.attempt++
    return Math.round(finalDelay)
  }

  /** Reset attempt counter after successful connection */
  reset(): void {
    this.attempt = 0
  }

  /** Get current attempt number */
  getAttempt(): number {
    return this.attempt
  }

  /** Check if max attempts reached */
  isExhausted(): boolean {
    return this.attempt >= this.maxAttempts
  }
}
