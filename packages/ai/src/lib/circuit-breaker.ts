/**
 * Circuit breaker pattern for provider failover
 * Prevents cascading failures by opening circuits for failing providers
 * Implements closed -> open -> half-open -> closed state transitions
 */

import { getAvailableProviders } from './model-registry'
import type { ProviderName } from '../types/ai-types'
import { retryWithBackoff, type RetryOptions } from './retry-handler'

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerOptions {
  failureThreshold?: number
  recoveryTimeoutMs?: number
  halfOpenMaxAttempts?: number
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30000,
  halfOpenMaxAttempts: 3,
}

export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime = 0
  private options: Required<CircuitBreakerOptions>

  constructor(options?: CircuitBreakerOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  canExecute(): boolean {
    if (this.state === 'closed') {
      return true
    }

    if (this.state === 'open') {
      const now = Date.now()
      if (now - this.lastFailureTime >= this.options.recoveryTimeoutMs) {
        this.state = 'half-open'
        this.successCount = 0
        return true
      }
      return false
    }

    // half-open
    return true
  }

  recordSuccess(): void {
    if (this.state === 'closed') {
      this.failureCount = 0
      this.successCount = 0
      return
    }

    if (this.state === 'half-open') {
      this.successCount++
      if (this.successCount >= this.options.halfOpenMaxAttempts) {
        this.state = 'closed'
        this.failureCount = 0
        this.successCount = 0
      }
    }
  }

  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === 'closed') {
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'open'
      }
    } else if (this.state === 'half-open') {
      this.state = 'open'
      this.successCount = 0
    }
  }

  getState(): CircuitState {
    return this.state
  }

  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
  }
}

const providerCircuits = new Map<string, CircuitBreaker>()

export function getOrCreateCircuit(
  provider: string,
  options?: CircuitBreakerOptions
): CircuitBreaker {
  let circuit = providerCircuits.get(provider)
  if (!circuit) {
    circuit = new CircuitBreaker(options)
    providerCircuits.set(provider, circuit)
  }
  return circuit
}

export class AllProvidersFailedError extends Error {
  constructor(public errors: Array<{ provider: string; error: Error }>) {
    const messages = errors.map(e => `${e.provider}: ${e.error.message}`).join(', ')
    super(`All providers failed: ${messages}`)
    this.name = 'AllProvidersFailedError'
  }
}

export interface CallWithFailoverOptions {
  retryOptions?: RetryOptions
  circuitOptions?: CircuitBreakerOptions
}

export async function callWithFailover<T>(
  fn: (provider: ProviderName) => Promise<T>,
  options?: CallWithFailoverOptions
): Promise<T> {
  const providers = getAvailableProviders()
  if (providers.length === 0) {
    throw new Error('No providers available')
  }

  const errors: Array<{ provider: string; error: Error }> = []

  // First pass: try providers with closed/half-open circuits
  const availableProviders = providers.filter(provider => {
    const circuit = getOrCreateCircuit(provider, options?.circuitOptions)
    return circuit.canExecute()
  })

  // If all circuits are open, try all providers as last resort
  const providersToTry = availableProviders.length > 0 ? availableProviders : providers

  for (const provider of providersToTry) {
    const circuit = getOrCreateCircuit(provider, options?.circuitOptions)

    try {
      const result = await retryWithBackoff(
        () => fn(provider),
        options?.retryOptions
      )
      circuit.recordSuccess()
      return result
    } catch (error) {
      circuit.recordFailure()
      errors.push({
        provider,
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  throw new AllProvidersFailedError(errors)
}

export function getProviderHealth(): Record<string, CircuitState> {
  const health: Record<string, CircuitState> = {}
  for (const [provider, circuit] of providerCircuits.entries()) {
    health[provider] = circuit.getState()
  }
  return health
}

export function resetCircuits(): void {
  providerCircuits.clear()
}
