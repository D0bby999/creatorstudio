// Exponential backoff retry utility with jitter
// Zero external deps, serverless-compatible

export interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  factor?: number
  jitterFraction?: number
  shouldRetry?: (error: unknown) => boolean
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void
}

const DEFAULTS = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  factor: 2,
  jitterFraction: 0.3,
} as const

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const {
    maxRetries = DEFAULTS.maxRetries,
    baseDelayMs = DEFAULTS.baseDelayMs,
    maxDelayMs = DEFAULTS.maxDelayMs,
    factor = DEFAULTS.factor,
    jitterFraction = DEFAULTS.jitterFraction,
    shouldRetry,
    onRetry,
  } = options ?? {}

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) break
      if (shouldRetry && !shouldRetry(error)) break

      const exponentialDelay = Math.min(baseDelayMs * factor ** attempt, maxDelayMs)
      const jitter = exponentialDelay * Math.random() * jitterFraction
      const delayMs = Math.round(exponentialDelay + jitter)

      onRetry?.(attempt + 1, error, delayMs)

      await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw lastError
}
