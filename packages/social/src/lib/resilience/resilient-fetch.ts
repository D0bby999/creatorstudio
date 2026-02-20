// Composed resilient fetch: rate limit -> circuit breaker -> retry -> native fetch
// Factory returns a fetch-compatible function

import { retryWithBackoff, type RetryOptions } from './retry-with-backoff'
import { CircuitBreaker, type CircuitBreakerOptions } from './circuit-breaker'
import { TokenBucket, type TokenBucketOptions } from './token-bucket-rate-limiter'

export interface ResilientFetchOptions {
  platform: string
  retry?: RetryOptions
  circuitBreaker?: CircuitBreakerOptions
  rateLimiter?: TokenBucketOptions
  onRequest?: (url: string) => void
  onResponse?: (url: string, status: number, latencyMs: number) => void
  onError?: (url: string, error: unknown) => void
}

export function createResilientFetch(
  options: ResilientFetchOptions
): typeof fetch {
  const breaker = new CircuitBreaker(options.circuitBreaker)
  const bucket = options.rateLimiter ? new TokenBucket(options.rateLimiter) : null
  const retryOpts = options.retry

  const resilientFetch: typeof fetch = async (input, init?) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    options.onRequest?.(url)

    // Wait for rate limit token
    if (bucket) {
      await bucket.acquire()
    }

    const start = Date.now()

    try {
      const response = await breaker.execute(() =>
        retryWithBackoff(
          () => fetch(input, init),
          retryOpts
        )
      )

      const latencyMs = Date.now() - start
      options.onResponse?.(url, response.status, latencyMs)

      // Update rate limiter from response headers
      if (bucket) {
        bucket.updateFromHeaders(response.headers)
      }

      return response
    } catch (error) {
      const latencyMs = Date.now() - start
      options.onError?.(url, error)
      // Also report via onResponse with status 0 for metrics
      options.onResponse?.(url, 0, latencyMs)
      throw error
    }
  }

  return resilientFetch
}
