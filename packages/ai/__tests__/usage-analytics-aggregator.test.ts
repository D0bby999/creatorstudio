/**
 * Tests for usage analytics aggregator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TokenUsageRecord } from '../src/types/ai-types'
import {
  getTimeRange,
  getUsageSummary,
  getTopModels,
  getUsageTrend,
} from '../src/lib/usage-analytics-aggregator'

vi.mock('@creator-studio/redis/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))

const { cacheGet } = await import('@creator-studio/redis/cache')

describe('usage-analytics-aggregator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTimeRange', () => {
    it('returns today midnight to now for day range', () => {
      const { start, end } = getTimeRange('day')
      const now = Date.now()
      const todayMidnight = new Date()
      todayMidnight.setUTCHours(0, 0, 0, 0)

      expect(start).toBe(todayMidnight.getTime())
      expect(end).toBeGreaterThanOrEqual(now - 1000) // within 1 second
      expect(end).toBeLessThanOrEqual(now + 1000)
    })

    it('returns 7 days ago midnight to now for week range', () => {
      const { start, end } = getTimeRange('week')
      const now = Date.now()
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setUTCHours(0, 0, 0, 0)

      expect(start).toBe(weekAgo.getTime())
      expect(end).toBeGreaterThanOrEqual(now - 1000)
    })

    it('returns 30 days ago midnight to now for month range', () => {
      const { start, end } = getTimeRange('month')
      const now = Date.now()
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      monthAgo.setUTCHours(0, 0, 0, 0)

      expect(start).toBe(monthAgo.getTime())
      expect(end).toBeGreaterThanOrEqual(now - 1000)
    })
  })

  describe('getUsageSummary', () => {
    it('filters records from today only for day range', async () => {
      const todayMidnight = new Date()
      todayMidnight.setUTCHours(0, 0, 0, 0)
      const yesterdayNoon = todayMidnight.getTime() - 12 * 60 * 60 * 1000

      const records: TokenUsageRecord[] = [
        {
          sessionId: 'sess1',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCostUsd: 0.01,
          timestamp: Date.now(),
        },
        {
          sessionId: 'sess2',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
          estimatedCostUsd: 0.02,
          timestamp: yesterdayNoon, // Should be filtered out
        },
      ]

      vi.mocked(cacheGet).mockResolvedValue(records)

      const summary = await getUsageSummary('user1', 'day')

      expect(summary.totalTokens).toBe(150)
      expect(summary.totalCostUsd).toBe(0.01)
      expect(summary.requestCount).toBe(1)
    })

    it('includes 7 days of records for week range', async () => {
      const now = Date.now()
      const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000

      const records: TokenUsageRecord[] = [
        {
          sessionId: 'sess1',
          provider: 'anthropic',
          model: 'claude-3-5-haiku-latest',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCostUsd: 0.01,
          timestamp: now,
        },
        {
          sessionId: 'sess2',
          provider: 'anthropic',
          model: 'claude-3-5-haiku-latest',
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
          estimatedCostUsd: 0.02,
          timestamp: fiveDaysAgo,
        },
        {
          sessionId: 'sess3',
          provider: 'google',
          model: 'gemini-2.0-flash',
          promptTokens: 300,
          completionTokens: 150,
          totalTokens: 450,
          estimatedCostUsd: 0.03,
          timestamp: tenDaysAgo, // Should be filtered out
        },
      ]

      vi.mocked(cacheGet).mockResolvedValue(records)

      const summary = await getUsageSummary('user1', 'week')

      expect(summary.totalTokens).toBe(450) // 150 + 300
      expect(summary.totalCostUsd).toBe(0.03) // 0.01 + 0.02
      expect(summary.requestCount).toBe(2)
    })

    it('groups by model correctly', async () => {
      const now = Date.now()

      const records: TokenUsageRecord[] = [
        {
          sessionId: 'sess1',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCostUsd: 0.01,
          timestamp: now,
        },
        {
          sessionId: 'sess2',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
          estimatedCostUsd: 0.02,
          timestamp: now,
        },
        {
          sessionId: 'sess3',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-latest',
          promptTokens: 500,
          completionTokens: 250,
          totalTokens: 750,
          estimatedCostUsd: 0.05,
          timestamp: now,
        },
      ]

      vi.mocked(cacheGet).mockResolvedValue(records)

      const summary = await getUsageSummary('user1', 'day')

      expect(summary.byModel['gpt-4o-mini']).toEqual({
        tokens: 450, // 150 + 300
        costUsd: 0.03, // 0.01 + 0.02
        count: 2,
      })

      expect(summary.byModel['claude-3-5-sonnet-latest']).toEqual({
        tokens: 750,
        costUsd: 0.05,
        count: 1,
      })
    })

    it('groups by provider correctly', async () => {
      const now = Date.now()

      const records: TokenUsageRecord[] = [
        {
          sessionId: 'sess1',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCostUsd: 0.01,
          timestamp: now,
        },
        {
          sessionId: 'sess2',
          provider: 'openai',
          model: 'gpt-4o',
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
          estimatedCostUsd: 0.02,
          timestamp: now,
        },
        {
          sessionId: 'sess3',
          provider: 'anthropic',
          model: 'claude-3-5-haiku-latest',
          promptTokens: 500,
          completionTokens: 250,
          totalTokens: 750,
          estimatedCostUsd: 0.05,
          timestamp: now,
        },
      ]

      vi.mocked(cacheGet).mockResolvedValue(records)

      const summary = await getUsageSummary('user1', 'day')

      expect(summary.byProvider['openai']).toEqual({
        tokens: 450, // 150 + 300
        costUsd: 0.03, // 0.01 + 0.02
        count: 2,
      })

      expect(summary.byProvider['anthropic']).toEqual({
        tokens: 750,
        costUsd: 0.05,
        count: 1,
      })
    })

    it('returns empty summary when no records exist', async () => {
      vi.mocked(cacheGet).mockResolvedValue([])

      const summary = await getUsageSummary('user1', 'day')

      expect(summary.totalTokens).toBe(0)
      expect(summary.totalCostUsd).toBe(0)
      expect(summary.requestCount).toBe(0)
      expect(summary.byModel).toEqual({})
      expect(summary.byProvider).toEqual({})
    })

    it('returns empty summary when Redis is unavailable', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis connection failed'))

      const summary = await getUsageSummary('user1', 'day')

      expect(summary.totalTokens).toBe(0)
      expect(summary.totalCostUsd).toBe(0)
      expect(summary.requestCount).toBe(0)
      expect(summary.byModel).toEqual({})
      expect(summary.byProvider).toEqual({})
    })

    it('returns empty summary when cacheGet returns null', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null)

      const summary = await getUsageSummary('user1', 'day')

      expect(summary.totalTokens).toBe(0)
      expect(summary.requestCount).toBe(0)
    })
  })

  describe('getTopModels', () => {
    it('returns models sorted by token count descending', async () => {
      const now = Date.now()

      const records: TokenUsageRecord[] = [
        {
          sessionId: 'sess1',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCostUsd: 0.01,
          timestamp: now,
        },
        {
          sessionId: 'sess2',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-latest',
          promptTokens: 500,
          completionTokens: 250,
          totalTokens: 750,
          estimatedCostUsd: 0.05,
          timestamp: now,
        },
        {
          sessionId: 'sess3',
          provider: 'google',
          model: 'gemini-2.0-flash',
          promptTokens: 300,
          completionTokens: 150,
          totalTokens: 450,
          estimatedCostUsd: 0.03,
          timestamp: now,
        },
      ]

      vi.mocked(cacheGet).mockResolvedValue(records)

      const topModels = await getTopModels('user1', 'day')

      expect(topModels).toHaveLength(3)
      expect(topModels[0]).toEqual({
        model: 'claude-3-5-sonnet-latest',
        tokens: 750,
        costUsd: 0.05,
      })
      expect(topModels[1]).toEqual({
        model: 'gemini-2.0-flash',
        tokens: 450,
        costUsd: 0.03,
      })
      expect(topModels[2]).toEqual({
        model: 'gpt-4o-mini',
        tokens: 150,
        costUsd: 0.01,
      })
    })

    it('respects limit parameter', async () => {
      const now = Date.now()

      const records: TokenUsageRecord[] = [
        {
          sessionId: 'sess1',
          provider: 'openai',
          model: 'model1',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 500,
          estimatedCostUsd: 0.05,
          timestamp: now,
        },
        {
          sessionId: 'sess2',
          provider: 'openai',
          model: 'model2',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 400,
          estimatedCostUsd: 0.04,
          timestamp: now,
        },
        {
          sessionId: 'sess3',
          provider: 'openai',
          model: 'model3',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 300,
          estimatedCostUsd: 0.03,
          timestamp: now,
        },
        {
          sessionId: 'sess4',
          provider: 'openai',
          model: 'model4',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 200,
          estimatedCostUsd: 0.02,
          timestamp: now,
        },
      ]

      vi.mocked(cacheGet).mockResolvedValue(records)

      const topModels = await getTopModels('user1', 'day', 2)

      expect(topModels).toHaveLength(2)
      expect(topModels[0].model).toBe('model1')
      expect(topModels[1].model).toBe('model2')
    })

    it('returns empty array when no records exist', async () => {
      vi.mocked(cacheGet).mockResolvedValue([])

      const topModels = await getTopModels('user1', 'day')

      expect(topModels).toEqual([])
    })
  })

  describe('getUsageTrend', () => {
    it('groups records by date and returns sorted entries', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const records: TokenUsageRecord[] = [
        {
          sessionId: 'sess1',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCostUsd: 0.01,
          timestamp: today.getTime(),
        },
        {
          sessionId: 'sess2',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
          estimatedCostUsd: 0.02,
          timestamp: today.getTime(),
        },
        {
          sessionId: 'sess3',
          provider: 'anthropic',
          model: 'claude-3-5-haiku-latest',
          promptTokens: 500,
          completionTokens: 250,
          totalTokens: 750,
          estimatedCostUsd: 0.05,
          timestamp: yesterday.getTime(),
        },
      ]

      vi.mocked(cacheGet).mockResolvedValue(records)

      const trend = await getUsageTrend('user1', 7)

      expect(trend).toHaveLength(2)

      // Should be sorted by date ascending
      expect(trend[0].date).toBe(yesterday.toISOString().split('T')[0])
      expect(trend[0].tokens).toBe(750)
      expect(trend[0].costUsd).toBe(0.05)

      expect(trend[1].date).toBe(today.toISOString().split('T')[0])
      expect(trend[1].tokens).toBe(450) // 150 + 300
      expect(trend[1].costUsd).toBe(0.03) // 0.01 + 0.02
    })

    it('filters records older than specified days', async () => {
      const now = Date.now()
      const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000

      const records: TokenUsageRecord[] = [
        {
          sessionId: 'sess1',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCostUsd: 0.01,
          timestamp: now,
        },
        {
          sessionId: 'sess2',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
          estimatedCostUsd: 0.02,
          timestamp: fiveDaysAgo,
        },
        {
          sessionId: 'sess3',
          provider: 'anthropic',
          model: 'claude-3-5-haiku-latest',
          promptTokens: 500,
          completionTokens: 250,
          totalTokens: 750,
          estimatedCostUsd: 0.05,
          timestamp: tenDaysAgo, // Should be filtered out
        },
      ]

      vi.mocked(cacheGet).mockResolvedValue(records)

      const trend = await getUsageTrend('user1', 7)

      // Only 2 records within 7 days
      expect(trend.some(entry => entry.tokens === 750)).toBe(false)
    })

    it('returns empty array when no records exist', async () => {
      vi.mocked(cacheGet).mockResolvedValue([])

      const trend = await getUsageTrend('user1', 7)

      expect(trend).toEqual([])
    })

    it('returns empty array when Redis is unavailable', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis connection failed'))

      const trend = await getUsageTrend('user1', 7)

      expect(trend).toEqual([])
    })
  })
})
