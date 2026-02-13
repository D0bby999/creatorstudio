import { describe, it, expect, vi } from 'vitest'
import { calculateBackoff, withRetry } from '../src/lib/retry-handler'

describe('retry-handler', () => {
  describe('calculateBackoff', () => {
    it('should return delay in expected range for attempt 0', () => {
      const delay = calculateBackoff(0, 1000)
      // Exponential: 1000 * 2^0 = 1000, Jitter: 0-500
      expect(delay).toBeGreaterThanOrEqual(1000)
      expect(delay).toBeLessThanOrEqual(1500)
    })

    it('should return delay in expected range for attempt 2', () => {
      const delay = calculateBackoff(2, 1000)
      // Exponential: 1000 * 2^2 = 4000, Jitter: 0-500
      expect(delay).toBeGreaterThanOrEqual(4000)
      expect(delay).toBeLessThanOrEqual(4500)
    })

    it('should use custom base delay', () => {
      const delay = calculateBackoff(0, 500)
      // Exponential: 500 * 2^0 = 500, Jitter: 0-250
      expect(delay).toBeGreaterThanOrEqual(500)
      expect(delay).toBeLessThanOrEqual(750)
    })
  })

  describe('withRetry', () => {
    it('should succeed on third attempt', async () => {
      let attempts = 0
      const fn = vi.fn(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Failed')
        }
        return 'success'
      })

      const result = await withRetry(fn, 3, 10) // Short delay for testing
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw error after maxRetries exceeded', async () => {
      const fn = vi.fn(async () => {
        throw new Error('Persistent failure')
      })

      await expect(withRetry(fn, 2, 10)).rejects.toThrow('Persistent failure')
      expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should succeed immediately if no errors', async () => {
      const fn = vi.fn(async () => 'immediate success')

      const result = await withRetry(fn, 3, 10)
      expect(result).toBe('immediate success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should call function once with maxRetries=0', async () => {
      const fn = vi.fn(async () => {
        throw new Error('No retries')
      })

      await expect(withRetry(fn, 0, 10)).rejects.toThrow('No retries')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should convert non-Error throws to Error objects', async () => {
      const fn = vi.fn(async () => {
        throw 'String error'
      })

      await expect(withRetry(fn, 1, 10)).rejects.toThrow('String error')
    })
  })
})
