import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@creator-studio/redis/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))
vi.mock('@creator-studio/redis/rate-limiter', () => ({
  checkRateLimit: vi.fn(),
}))
vi.mock('../src/lib/token-usage-tracker', () => ({
  getUserDailyUsage: vi.fn(),
}))

import { checkRateLimit } from '@creator-studio/redis/rate-limiter'
import { cacheGet, cacheSet } from '@creator-studio/redis/cache'
import { getUserDailyUsage } from '../src/lib/token-usage-tracker'
import {
  checkAiRateLimit,
  recordAiUsage,
  getAiUsageStatus,
  AiRateLimitError,
  type UserTier,
} from '../src/lib/ai-rate-limiter'

describe('ai-rate-limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset env vars
    delete process.env.AI_RATE_LIMIT_FREE_TOKENS
    delete process.env.AI_RATE_LIMIT_FREE_RPM
    delete process.env.AI_RATE_LIMIT_PRO_TOKENS
    delete process.env.AI_RATE_LIMIT_PRO_RPM
  })

  describe('checkAiRateLimit', () => {
    it('should allow request when under both RPM and token limits', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 1000, estimatedCostUsd: 0.01 })

      const result = await checkAiRateLimit('user-123', 'free')

      expect(result.allowed).toBe(true)
      expect(result.remaining.tokens).toBe(4000) // 5000 - 1000
      expect(result.tier).toBe('free')
      expect(checkRateLimit).toHaveBeenCalledWith('user-123', 5, 60)
    })

    it('should throw AiRateLimitError when daily tokens exceeded', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 6000, estimatedCostUsd: 0.06 })

      await expect(checkAiRateLimit('user-123', 'free')).rejects.toThrow(AiRateLimitError)

      try {
        await checkAiRateLimit('user-123', 'free')
      } catch (error) {
        expect(error).toBeInstanceOf(AiRateLimitError)
        expect((error as AiRateLimitError).limit).toBe(5000)
        expect((error as AiRateLimitError).remaining).toBe(0)
        expect((error as AiRateLimitError).retryAfter).toBeGreaterThan(0)
        expect((error as AiRateLimitError).message).toContain('Daily token limit exceeded')
      }
    })

    it('should throw AiRateLimitError when RPM exceeded', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'Retry-After': '30',
          'X-RateLimit-Reset': String(Date.now() + 30000),
        },
      })
      vi.mocked(checkRateLimit).mockRejectedValue(mockResponse)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 1000, estimatedCostUsd: 0.01 })

      await expect(checkAiRateLimit('user-123', 'free')).rejects.toThrow(AiRateLimitError)

      try {
        await checkAiRateLimit('user-123', 'free')
      } catch (error) {
        expect(error).toBeInstanceOf(AiRateLimitError)
        expect((error as AiRateLimitError).limit).toBe(5)
        expect((error as AiRateLimitError).retryAfter).toBe(30)
        expect((error as AiRateLimitError).message).toContain('5 requests per minute')
      }
    })

    it('should return correct remaining counts', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 2500, estimatedCostUsd: 0.025 })

      const result = await checkAiRateLimit('user-123', 'free')

      expect(result.remaining.tokens).toBe(2500) // 5000 - 2500
      expect(result.remaining.requests).toBe(5)
    })

    it('should fall back gracefully when Redis unavailable', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(new Error('Redis unavailable'))
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 0, estimatedCostUsd: 0 })

      const result = await checkAiRateLimit('user-123', 'free')

      expect(result.allowed).toBe(true)
      expect(result.remaining.requests).toBe(5)
    })

    it('should handle Redis failure in getUserDailyUsage gracefully', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockRejectedValue(new Error('Redis down'))

      const result = await checkAiRateLimit('user-123', 'free')

      expect(result.allowed).toBe(true)
      expect(result.remaining.tokens).toBe(5000) // Assumes 0 usage
    })

    it('should apply different tier limits correctly - free', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 4000, estimatedCostUsd: 0.04 })

      const result = await checkAiRateLimit('user-123', 'free')

      expect(result.remaining.tokens).toBe(1000) // 5000 - 4000
      expect(checkRateLimit).toHaveBeenCalledWith('user-123', 5, 60)
    })

    it('should apply different tier limits correctly - pro', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 50000, estimatedCostUsd: 0.5 })

      const result = await checkAiRateLimit('user-456', 'pro')

      expect(result.remaining.tokens).toBe(50000) // 100000 - 50000
      expect(checkRateLimit).toHaveBeenCalledWith('user-456', 30, 60)
    })

    it('should apply different tier limits correctly - enterprise', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 500000, estimatedCostUsd: 5 })

      const result = await checkAiRateLimit('user-789', 'enterprise')

      expect(result.remaining.tokens).toBe(500000) // 1000000 - 500000
      expect(checkRateLimit).toHaveBeenCalledWith('user-789', 100, 60)
    })

    it('should respect env var overrides for free tier', async () => {
      process.env.AI_RATE_LIMIT_FREE_TOKENS = '10000'
      process.env.AI_RATE_LIMIT_FREE_RPM = '10'

      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 2000, estimatedCostUsd: 0.02 })

      const result = await checkAiRateLimit('user-123', 'free')

      expect(result.remaining.tokens).toBe(8000) // 10000 - 2000
      expect(checkRateLimit).toHaveBeenCalledWith('user-123', 10, 60)
    })

    it('should respect env var overrides for pro tier', async () => {
      process.env.AI_RATE_LIMIT_PRO_TOKENS = '200000'
      process.env.AI_RATE_LIMIT_PRO_RPM = '50'

      vi.mocked(checkRateLimit).mockResolvedValue(undefined)
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 100000, estimatedCostUsd: 1 })

      const result = await checkAiRateLimit('user-456', 'pro')

      expect(result.remaining.tokens).toBe(100000) // 200000 - 100000
      expect(checkRateLimit).toHaveBeenCalledWith('user-456', 50, 60)
    })
  })

  describe('recordAiUsage', () => {
    it('should increment daily counter via cache', async () => {
      const today = new Date().toISOString().split('T')[0]
      const expectedKey = `ai:daily:user-123:${today}`

      vi.mocked(cacheGet).mockResolvedValue(1000)
      vi.mocked(cacheSet).mockResolvedValue(undefined)

      await recordAiUsage('user-123', 500)

      expect(cacheGet).toHaveBeenCalledWith(expectedKey)
      expect(cacheSet).toHaveBeenCalledWith(expectedKey, 1500, 86400)
    })

    it('should initialize counter when no previous usage', async () => {
      const today = new Date().toISOString().split('T')[0]
      const expectedKey = `ai:daily:user-123:${today}`

      vi.mocked(cacheGet).mockResolvedValue(null)
      vi.mocked(cacheSet).mockResolvedValue(undefined)

      await recordAiUsage('user-123', 250)

      expect(cacheSet).toHaveBeenCalledWith(expectedKey, 250, 86400)
    })

    it('should use 24h TTL for daily counters', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null)
      vi.mocked(cacheSet).mockResolvedValue(undefined)

      await recordAiUsage('user-456', 100)

      expect(cacheSet).toHaveBeenCalledWith(expect.any(String), 100, 86400)
    })

    it('should handle Redis failures gracefully', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis down'))

      await expect(recordAiUsage('user-123', 500)).resolves.not.toThrow()
    })
  })

  describe('getAiUsageStatus', () => {
    it('should return current usage status for free tier', async () => {
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 3000, estimatedCostUsd: 0.03 })

      const status = await getAiUsageStatus('user-123', 'free')

      expect(status.tier).toBe('free')
      expect(status.tokensUsed).toBe(3000)
      expect(status.tokensLimit).toBe(5000)
      expect(status.tokensRemaining).toBe(2000)
      expect(status.requestsRemaining).toBe(5)
    })

    it('should return current usage status for pro tier', async () => {
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 70000, estimatedCostUsd: 0.7 })

      const status = await getAiUsageStatus('user-456', 'pro')

      expect(status.tier).toBe('pro')
      expect(status.tokensUsed).toBe(70000)
      expect(status.tokensLimit).toBe(100000)
      expect(status.tokensRemaining).toBe(30000)
      expect(status.requestsRemaining).toBe(30)
    })

    it('should handle zero remaining tokens', async () => {
      vi.mocked(getUserDailyUsage).mockResolvedValue({ totalTokens: 6000, estimatedCostUsd: 0.06 })

      const status = await getAiUsageStatus('user-123', 'free')

      expect(status.tokensRemaining).toBe(0) // Max(0, 5000 - 6000)
    })

    it('should return zero usage when Redis unavailable', async () => {
      vi.mocked(getUserDailyUsage).mockRejectedValue(new Error('Redis down'))

      const status = await getAiUsageStatus('user-123', 'free')

      expect(status.tokensUsed).toBe(0)
      expect(status.tokensRemaining).toBe(5000)
    })
  })

  describe('AiRateLimitError', () => {
    it('should have retryAfter property', () => {
      const error = new AiRateLimitError('Test', 60, 100, 0)
      expect(error.retryAfter).toBe(60)
    })

    it('should have limit property', () => {
      const error = new AiRateLimitError('Test', 60, 100, 0)
      expect(error.limit).toBe(100)
    })

    it('should have remaining property', () => {
      const error = new AiRateLimitError('Test', 60, 100, 5)
      expect(error.remaining).toBe(5)
    })

    it('should have correct name', () => {
      const error = new AiRateLimitError('Test', 60, 100, 0)
      expect(error.name).toBe('AiRateLimitError')
    })

    it('should extend Error', () => {
      const error = new AiRateLimitError('Test', 60, 100, 0)
      expect(error).toBeInstanceOf(Error)
    })
  })
})
