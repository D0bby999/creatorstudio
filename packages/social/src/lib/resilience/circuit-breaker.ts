// Circuit breaker with closed/open/half-open state machine
// Per-platform instance, in-memory state (resets on cold start)

export type CircuitState = 'closed' | 'open' | 'half_open'

export interface CircuitBreakerOptions {
  failureThreshold?: number
  resetTimeoutMs?: number
  onStateChange?: (from: CircuitState, to: CircuitState) => void
}

export class CircuitOpenError extends Error {
  readonly isCircuitOpen = true
  constructor(message = 'Circuit breaker is open') {
    super(message)
    this.name = 'CircuitOpenError'
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private consecutiveFailures = 0
  private lastFailureTime = 0
  private halfOpenProbeInFlight = false
  private readonly failureThreshold: number
  private readonly resetTimeoutMs: number
  private readonly onStateChange?: (from: CircuitState, to: CircuitState) => void

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 5
    this.resetTimeoutMs = options?.resetTimeoutMs ?? 30000
    this.onStateChange = options?.onStateChange
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        // Only allow single probe in half-open state
        if (this.halfOpenProbeInFlight) {
          throw new CircuitOpenError('Circuit breaker is half-open, probe in flight')
        }
        this.transition('half_open')
        this.halfOpenProbeInFlight = true
      } else {
        throw new CircuitOpenError()
      }
    } else if (this.state === 'half_open' && this.halfOpenProbeInFlight) {
      throw new CircuitOpenError('Circuit breaker is half-open, probe in flight')
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  getState(): CircuitState {
    return this.state
  }

  reset(): void {
    this.state = 'closed'
    this.consecutiveFailures = 0
    this.lastFailureTime = 0
    this.halfOpenProbeInFlight = false
  }

  private onSuccess(): void {
    this.halfOpenProbeInFlight = false
    if (this.state === 'half_open') {
      this.transition('closed')
    }
    this.consecutiveFailures = 0
  }

  private onFailure(): void {
    this.halfOpenProbeInFlight = false
    this.consecutiveFailures++
    this.lastFailureTime = Date.now()

    if (this.state === 'half_open') {
      this.transition('open')
    } else if (this.consecutiveFailures >= this.failureThreshold) {
      this.transition('open')
    }
  }

  private transition(to: CircuitState): void {
    const from = this.state
    if (from === to) return
    this.state = to
    if (to === 'closed') this.consecutiveFailures = 0
    this.onStateChange?.(from, to)
  }
}
