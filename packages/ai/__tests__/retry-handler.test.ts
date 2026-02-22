import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retryWithBackoff, isRetryableError, sleep } from '../src/lib/retry-handler'

describe('retry-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isRetryableError', () => {
    it('classifies 429 as retryable', () => {
      const error = { status: 429, message: 'Too Many Requests' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies 500 as retryable', () => {
      const error = { status: 500, message: 'Internal Server Error' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies 502 as retryable', () => {
      const error = { statusCode: 502, message: 'Bad Gateway' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies 503 as retryable', () => {
      const error = { status: 503, message: 'Service Unavailable' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies 504 as retryable', () => {
      const error = { status: 504, message: 'Gateway Timeout' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies 400 as non-retryable', () => {
      const error = { status: 400, message: 'Bad Request' }
      expect(isRetryableError(error)).toBe(false)
    })

    it('classifies 401 as non-retryable', () => {
      const error = { status: 401, message: 'Unauthorized' }
      expect(isRetryableError(error)).toBe(false)
    })

    it('classifies 403 as non-retryable', () => {
      const error = { status: 403, message: 'Forbidden' }
      expect(isRetryableError(error)).toBe(false)
    })

    it('classifies 422 as non-retryable', () => {
      const error = { status: 422, message: 'Unprocessable Entity' }
      expect(isRetryableError(error)).toBe(false)
    })

    it('classifies ECONNRESET as retryable', () => {
      const error = new Error('ECONNRESET')
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies ECONNREFUSED as retryable', () => {
      const error = new Error('ECONNREFUSED')
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies ETIMEDOUT as retryable', () => {
      const error = new Error('ETIMEDOUT')
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies "fetch failed" as retryable', () => {
      const error = new Error('fetch failed')
      expect(isRetryableError(error)).toBe(true)
    })

    it('classifies status code in message as retryable', () => {
      const error = new Error('Request failed with status 503')
      expect(isRetryableError(error)).toBe(true)
    })
  })

  describe('retryWithBackoff', () => {
    it('succeeds on first attempt without retry', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const result = await retryWithBackoff(mockFn, { baseDelayMs: 1 })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('retries on 429 error and succeeds on attempt 2', async () => {
      const error429 = { status: 429, message: 'Too Many Requests' }
      const mockFn = vi.fn()
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce('success')

      const result = await retryWithBackoff(mockFn, { baseDelayMs: 1 })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('retries on 500 error and succeeds on attempt 3', async () => {
      const error500 = { status: 500, message: 'Internal Server Error' }
      const mockFn = vi.fn()
        .mockRejectedValueOnce(error500)
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce('success')

      const result = await retryWithBackoff(mockFn, { baseDelayMs: 1 })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('throws immediately on 400 (non-retryable)', async () => {
      const error400 = { status: 400, message: 'Bad Request' }
      const mockFn = vi.fn().mockRejectedValue(error400)

      await expect(retryWithBackoff(mockFn, { baseDelayMs: 1 }))
        .rejects.toEqual(error400)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('throws immediately on 422 (non-retryable)', async () => {
      const error422 = { status: 422, message: 'Unprocessable Entity' }
      const mockFn = vi.fn().mockRejectedValue(error422)

      await expect(retryWithBackoff(mockFn, { baseDelayMs: 1 }))
        .rejects.toEqual(error422)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('throws after max retries exhausted (3 attempts)', async () => {
      const error503 = { status: 503, message: 'Service Unavailable' }
      const mockFn = vi.fn().mockRejectedValue(error503)

      await expect(retryWithBackoff(mockFn, { maxRetries: 3, baseDelayMs: 1 }))
        .rejects.toEqual(error503)

      // maxRetries: 3 means 4 total attempts (initial + 3 retries)
      expect(mockFn).toHaveBeenCalledTimes(4)
    })

    it('respects custom maxRetries option', async () => {
      const error429 = { status: 429, message: 'Too Many Requests' }
      const mockFn = vi.fn().mockRejectedValue(error429)

      await expect(retryWithBackoff(mockFn, { maxRetries: 1, baseDelayMs: 1 }))
        .rejects.toEqual(error429)

      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('applies exponential backoff delay', async () => {
      const error503 = { status: 503, message: 'Service Unavailable' }
      const mockFn = vi.fn()
        .mockRejectedValueOnce(error503)
        .mockRejectedValueOnce(error503)
        .mockResolvedValueOnce('success')

      const startTime = Date.now()
      await retryWithBackoff(mockFn, { baseDelayMs: 50, maxDelayMs: 10000, jitterFactor: 0 })
      const duration = Date.now() - startTime

      // First retry: 50 * 2^0 = 50ms
      // Second retry: 50 * 2^1 = 100ms
      // Total: ~150ms (allow some margin for execution time)
      expect(duration).toBeGreaterThanOrEqual(130)
      expect(duration).toBeLessThan(200)
      expect(mockFn).toHaveBeenCalledTimes(3)
    })
  })
})
