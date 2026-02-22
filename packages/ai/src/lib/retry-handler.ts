/**
 * Retry handler with exponential backoff
 * Handles retryable errors (429, 5xx, network) with configurable backoff strategy
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitterFactor?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.3,
}

const RETRYABLE_HTTP_CODES = [429, 500, 502, 503, 504]
const NETWORK_ERROR_PATTERNS = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'fetch failed']
const NON_RETRYABLE_HTTP_CODES = [400, 401, 403, 422]

export function isRetryableError(error: unknown): boolean {
  if (!error) return false

  const err = error as any

  // Check HTTP status codes
  const status = err.status || err.statusCode
  if (typeof status === 'number') {
    if (NON_RETRYABLE_HTTP_CODES.includes(status)) return false
    if (RETRYABLE_HTTP_CODES.includes(status)) return true
  }

  // Check error message for network errors
  const message = err.message || String(error)
  if (typeof message === 'string') {
    if (NETWORK_ERROR_PATTERNS.some(pattern => message.includes(pattern))) {
      return true
    }
    // Check for status code in message
    for (const code of RETRYABLE_HTTP_CODES) {
      if (message.includes(String(code))) return true
    }
  }

  return false
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) break

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error
      }

      // Calculate delay with exponential backoff
      const baseDelay = opts.baseDelayMs * Math.pow(2, attempt)
      const cappedDelay = Math.min(baseDelay, opts.maxDelayMs)

      // Add jitter
      const jitter = (Math.random() - 0.5) * 2 * opts.jitterFactor
      const delay = cappedDelay * (1 + jitter)

      await sleep(delay)
    }
  }

  throw lastError
}
