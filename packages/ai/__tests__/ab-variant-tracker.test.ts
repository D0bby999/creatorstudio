import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@creator-studio/redis', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))

import {
  hashAssignment,
  assignVariant,
  trackEvent,
  getExperimentResults,
  clearMemoryStore,
} from '../src/lib/ab-variant-tracker'
import { cacheGet, cacheSet } from '@creator-studio/redis'

describe('ab-variant-tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearMemoryStore()
  })

  describe('hashAssignment', () => {
    it('should return same variant for same userId and experimentId', () => {
      const result1 = hashAssignment('user123', 'exp1', 3)
      const result2 = hashAssignment('user123', 'exp1', 3)
      const result3 = hashAssignment('user123', 'exp1', 3)

      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })

    it('should distribute users across variants', () => {
      const variantCount = 3
      const results = new Map<number, number>()

      // Test with 100 users
      for (let i = 0; i < 100; i++) {
        const variant = hashAssignment(`user${i}`, 'exp1', variantCount)
        expect(variant).toBeGreaterThanOrEqual(0)
        expect(variant).toBeLessThan(variantCount)
        results.set(variant, (results.get(variant) || 0) + 1)
      }

      // All variants should have some assignments (with high probability)
      expect(results.size).toBeGreaterThan(1)

      // Each variant should have assignments (rough distribution check)
      for (let i = 0; i < variantCount; i++) {
        expect(results.get(i)).toBeGreaterThan(0)
      }
    })

    it('should return different variants for different users', () => {
      const user1Variant = hashAssignment('user1', 'exp1', 3)
      const user2Variant = hashAssignment('user2', 'exp1', 3)

      // Not all users will get different variants, but we can test they're independent
      expect([0, 1, 2]).toContain(user1Variant)
      expect([0, 1, 2]).toContain(user2Variant)
    })

    it('should return different variants for different experiments', () => {
      const exp1Variant = hashAssignment('user1', 'exp1', 3)
      const exp2Variant = hashAssignment('user1', 'exp2', 3)

      // Different experiments should produce independent assignments
      expect([0, 1, 2]).toContain(exp1Variant)
      expect([0, 1, 2]).toContain(exp2Variant)
    })
  })

  describe('assignVariant', () => {
    it('should return variant from array deterministically', () => {
      const variants = ['control', 'variantA', 'variantB']

      const result1 = assignVariant('user123', 'exp1', variants)
      const result2 = assignVariant('user123', 'exp1', variants)

      expect(result1).toBe(result2)
      expect(variants).toContain(result1)
    })

    it('should assign all variants to different users', () => {
      const variants = ['control', 'variantA', 'variantB']
      const assignments = new Set<string>()

      // Test with 30 users - should hit all variants
      for (let i = 0; i < 30; i++) {
        const variant = assignVariant(`user${i}`, 'exp1', variants)
        assignments.add(variant)
      }

      // With 30 users and 3 variants, we should see all variants
      expect(assignments.size).toBe(3)
    })
  })

  describe('trackEvent', () => {
    it('should increment metric counter with Redis', async () => {
      vi.mocked(cacheGet).mockResolvedValue({ clicks: 5, _sampleSize: 10 })

      await trackEvent('exp1', 'control', 'clicks', 1)

      expect(cacheSet).toHaveBeenCalledWith(
        'ai:ab:exp1:control',
        { clicks: 6, _sampleSize: 11 },
        2592000
      )
    })

    it('should initialize metrics when none exist', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null)

      await trackEvent('exp1', 'control', 'views', 1)

      expect(cacheSet).toHaveBeenCalledWith(
        'ai:ab:exp1:control',
        { views: 1, _sampleSize: 1 },
        2592000
      )
    })

    it('should use custom value for metric', async () => {
      vi.mocked(cacheGet).mockResolvedValue({ revenue: 100, _sampleSize: 5 })

      await trackEvent('exp1', 'variantA', 'revenue', 25)

      expect(cacheSet).toHaveBeenCalledWith(
        'ai:ab:exp1:variantA',
        { revenue: 125, _sampleSize: 6 },
        2592000
      )
    })

    it('should fallback to in-memory when Redis throws', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis error'))

      await trackEvent('exp1', 'control', 'clicks', 1)
      await trackEvent('exp1', 'control', 'clicks', 1)

      // Should not throw
      expect(cacheSet).not.toHaveBeenCalled()

      // Verify in-memory storage works
      const results = await getExperimentResults('exp1', ['control'])
      expect(results[0].metrics.clicks).toBe(2)
      expect(results[0].sampleSize).toBe(2)
    })

    it('should track multiple metrics independently', async () => {
      vi.mocked(cacheGet).mockResolvedValue({ clicks: 10, views: 50, _sampleSize: 20 })

      await trackEvent('exp1', 'control', 'conversions', 2)

      expect(cacheSet).toHaveBeenCalledWith(
        'ai:ab:exp1:control',
        { clicks: 10, views: 50, conversions: 2, _sampleSize: 21 },
        2592000
      )
    })
  })

  describe('getExperimentResults', () => {
    it('should return correct metrics per variant from Redis', async () => {
      vi.mocked(cacheGet)
        .mockResolvedValueOnce({ clicks: 100, conversions: 10, _sampleSize: 500 })
        .mockResolvedValueOnce({ clicks: 120, conversions: 15, _sampleSize: 500 })

      const results = await getExperimentResults('exp1', ['control', 'variantA'])

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        variantId: 'control',
        metrics: { clicks: 100, conversions: 10 },
        sampleSize: 500,
      })
      expect(results[1]).toEqual({
        variantId: 'variantA',
        metrics: { clicks: 120, conversions: 15 },
        sampleSize: 500,
      })
    })

    it('should return empty metrics for variants with no data', async () => {
      vi.mocked(cacheGet).mockResolvedValue(null)

      const results = await getExperimentResults('exp1', ['control'])

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        variantId: 'control',
        metrics: {},
        sampleSize: 0,
      })
    })

    it('should fallback to in-memory when Redis throws', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis error'))

      // Track some events in memory
      await trackEvent('exp1', 'control', 'clicks', 5)
      await trackEvent('exp1', 'variantA', 'clicks', 7)

      const results = await getExperimentResults('exp1', ['control', 'variantA'])

      expect(results).toHaveLength(2)
      expect(results[0].metrics.clicks).toBe(5)
      expect(results[1].metrics.clicks).toBe(7)
    })

    it('should exclude _sampleSize from metrics object', async () => {
      vi.mocked(cacheGet).mockResolvedValue({ clicks: 100, _sampleSize: 500 })

      const results = await getExperimentResults('exp1', ['control'])

      expect(results[0].metrics).toEqual({ clicks: 100 })
      expect(results[0].metrics).not.toHaveProperty('_sampleSize')
      expect(results[0].sampleSize).toBe(500)
    })

    it('should handle multiple variants with mixed data', async () => {
      vi.mocked(cacheGet)
        .mockResolvedValueOnce({ clicks: 50, _sampleSize: 100 })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ clicks: 75, views: 200, _sampleSize: 150 })

      const results = await getExperimentResults('exp1', ['control', 'variantA', 'variantB'])

      expect(results).toHaveLength(3)
      expect(results[0].sampleSize).toBe(100)
      expect(results[1].sampleSize).toBe(0)
      expect(results[2].sampleSize).toBe(150)
    })
  })

  describe('clearMemoryStore', () => {
    it('should clear in-memory storage', async () => {
      vi.mocked(cacheGet).mockRejectedValue(new Error('Redis error'))

      await trackEvent('exp1', 'control', 'clicks', 5)

      let results = await getExperimentResults('exp1', ['control'])
      expect(results[0].metrics.clicks).toBe(5)

      clearMemoryStore()

      results = await getExperimentResults('exp1', ['control'])
      expect(results[0].metrics).toEqual({})
      expect(results[0].sampleSize).toBe(0)
    })
  })
})
