/**
 * Calculate exponential backoff with jitter for retry attempts
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default 1000ms)
 * @returns Delay in milliseconds
 */
export function calculateBackoff(attempt: number, baseDelay = 1000): number {
  const exponential = baseDelay * Math.pow(2, attempt)
  const jitter = Math.random() * baseDelay * 0.5
  return exponential + jitter
}

/**
 * Execute a function with retry logic and exponential backoff
 * @param fn - Async function to execute
 * @param maxRetries - Maximum number of retry attempts (default 3)
 * @param baseDelay - Base delay for backoff calculation (default 1000ms)
 * @returns Promise resolving to function result
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const delay = calculateBackoff(attempt, baseDelay)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}
