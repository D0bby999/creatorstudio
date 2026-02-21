import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@creator-studio/redis/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))

import { estimateCost, trackUsage, getUsage, getUserDailyUsage, checkLimit } from '../src/lib/token-usage-tracker'
import { cacheGet, cacheSet } from '@creator-studio/redis/cache'

describe('token-usage-tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('estimateCost', () => {
    it('should calculate cost for gpt-4o-mini', () => {
      const cost = estimateCost({ promptTokens: 1000, completionTokens: 500 }, 'gpt-4o-mini')
      expect(cost).toBe(0.0004) // (1000 * 0.00015 + 500 * 0.0006) / 1000, rounded to 4 decimals
    })

    it('should calculate cost for gpt-4o', () => {
      const cost = estimateCost({ promptTokens: 1000, completionTokens: 500 }, 'gpt-4o')
      expect(cost).toBe(0.0075) // (1000 * 0.0025 + 500 * 0.01) / 1000
    })

    it('should return 0 for unknown model', () => {
      const cost = estimateCost({ promptTokens: 1000, completionTokens: 500 }, 'unknown-model')
      expect(cost).toBe(0)
    })

    it('should round to 4 decimal places', () => {
      const cost = estimateCost({ promptTokens: 123, completionTokens: 456 }, 'gpt-4o-mini')
      expect(cost.toString()).toMatch(/^\d+\.\d{1,4}$/)
    })
  })

  describe('trackUsage', () => {
    it('should store usage record in Redis', async () => {
      vi.mocked(cacheGet).mockResolvedValue([])
      vi.mocked(cacheSet).mockResolvedValue(undefined)

      await trackUsage('session-123', {
        provider: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        estimatedCostUsd: 0.0001,
        timestamp: Date.now(),
      })

      expect(cacheSet).toHaveBeenCalledWith(
        'ai:usage:session-123',
        expect.arrayContaining([
          expect.objectContaining({
            sessionId: 'session-123',
            provider: 'openai',
            model: 'gpt-4o-mini',
          }),
        ]),
        86400
      )
    })

    it('should append to existing records', async () => {
      const existing = [{ sessionId: 'session-123', totalTokens: 100, timestamp: Date.now() }]
      vi.mocked(cacheGet).mockResolvedValue(existing)
      vi.mocked(cacheSet).mockResolvedValue(undefined)

      await trackUsage('session-123', {
        provider: 'openai',
        model: 'gpt-4o',
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        estimatedCostUsd: 0.001,
        timestamp: Date.now(),
      })

      expect(cacheSet).toHaveBeenCalledWith(
        'ai:usage:session-123',
        expect.arrayContaining([
          existing[0],
          expect.objectContaining({ totalTokens: 300 }),
        ]),
        86400
      )
    })

    it('should silently fail on Redis error', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis unavailable'))
      await expect(trackUsage('session-123', {} as any)).resolves.toBeUndefined()
    })
  })

  describe('getUsage', () => {
    it('should return usage records from Redis', async () => {
      const records = [
        { sessionId: 'session-123', totalTokens: 100, timestamp: Date.now() },
      ]
      vi.mocked(cacheGet).mockResolvedValue(records)

      const result = await getUsage('session-123')
      expect(result).toEqual(records)
    })

    it('should return empty array when no records', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null)
      const result = await getUsage('session-123')
      expect(result).toEqual([])
    })

    it('should return empty array on Redis error', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis unavailable'))
      const result = await getUsage('session-123')
      expect(result).toEqual([])
    })
  })

  describe('getUserDailyUsage', () => {
    it('should aggregate today records', async () => {
      const todayMs = new Date().setHours(0, 0, 0, 0)
      const records = [
        { totalTokens: 100, estimatedCostUsd: 0.001, timestamp: todayMs + 1000 },
        { totalTokens: 200, estimatedCostUsd: 0.002, timestamp: todayMs + 2000 },
        { totalTokens: 50, estimatedCostUsd: 0.0005, timestamp: todayMs - 100000 }, // yesterday
      ]
      vi.mocked(cacheGet).mockResolvedValue(records)

      const result = await getUserDailyUsage('user-123')
      expect(result).toEqual({
        totalTokens: 300,
        estimatedCostUsd: 0.003,
      })
    })

    it('should return zero on Redis error', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis unavailable'))
      const result = await getUserDailyUsage('user-123')
      expect(result).toEqual({ totalTokens: 0, estimatedCostUsd: 0 })
    })
  })

  describe('checkLimit', () => {
    it('should return true when under limit', async () => {
      vi.mocked(cacheGet).mockResolvedValue([
        { totalTokens: 100, timestamp: Date.now() },
      ])
      const result = await checkLimit('user-123', 200)
      expect(result).toBe(true)
    })

    it('should return false when over limit', async () => {
      vi.mocked(cacheGet).mockResolvedValue([
        { totalTokens: 300, timestamp: Date.now() },
      ])
      const result = await checkLimit('user-123', 200)
      expect(result).toBe(false)
    })
  })
})
