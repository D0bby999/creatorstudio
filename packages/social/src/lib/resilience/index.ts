// Resilience utilities barrel export

export { retryWithBackoff, type RetryOptions } from './retry-with-backoff'
export {
  CircuitBreaker,
  CircuitOpenError,
  type CircuitState,
  type CircuitBreakerOptions,
} from './circuit-breaker'
export {
  TokenBucket,
  type TokenBucketOptions,
} from './token-bucket-rate-limiter'
export {
  createResilientFetch,
  type ResilientFetchOptions,
} from './resilient-fetch'

// Pre-configured platform rate limit configs
// capacity = max requests per window, refillRate = tokens per ms
export const PLATFORM_RATE_LIMITS: Record<string, { capacity: number; refillRate: number }> = {
  instagram: { capacity: 200, refillRate: 200 / 3600000 },   // 200/hr
  facebook:  { capacity: 200, refillRate: 200 / 3600000 },   // 200/hr
  threads:   { capacity: 200, refillRate: 200 / 3600000 },   // 200/hr
  tiktok:    { capacity: 600, refillRate: 600 / 86400000 },   // 600/day
  bluesky:   { capacity: 3000, refillRate: 3000 / 300000 },   // 3000/5min
}
