/**
 * A/B testing variant assignment and tracking
 */

import { cacheGet, cacheSet } from '@creator-studio/redis'

export interface ExperimentResult {
  variantId: string
  metrics: Record<string, number>
  sampleSize: number
}

// In-memory fallback when Redis unavailable
const memoryStore = new Map<string, Record<string, number>>()

/**
 * Deterministic hash assignment for user to variant
 */
export function hashAssignment(userId: string, experimentId: string, variantCount: number): number {
  const str = userId + ':' + experimentId
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % variantCount
}

/**
 * Assign user to a variant deterministically
 */
export function assignVariant(userId: string, experimentId: string, variants: string[]): string {
  return variants[hashAssignment(userId, experimentId, variants.length)]
}

/**
 * Track an event for a variant
 */
export async function trackEvent(
  experimentId: string,
  variantId: string,
  metric: string,
  value: number = 1
): Promise<void> {
  const key = `ai:ab:${experimentId}:${variantId}`

  try {
    // Try Redis first
    const existing = await cacheGet<Record<string, number>>(key)
    const metrics = existing || {}

    // Increment metric
    metrics[metric] = (metrics[metric] || 0) + value
    metrics._sampleSize = (metrics._sampleSize || 0) + 1

    await cacheSet(key, metrics, 2592000) // 30 days TTL
  } catch (error) {
    // Fallback to in-memory
    const metrics = memoryStore.get(key) || {}
    metrics[metric] = (metrics[metric] || 0) + value
    metrics._sampleSize = (metrics._sampleSize || 0) + 1
    memoryStore.set(key, metrics)
  }
}

/**
 * Get results for all variants in an experiment
 */
export async function getExperimentResults(
  experimentId: string,
  variants: string[]
): Promise<ExperimentResult[]> {
  const results: ExperimentResult[] = []

  for (const variantId of variants) {
    const key = `ai:ab:${experimentId}:${variantId}`

    try {
      // Try Redis first
      const metrics = await cacheGet<Record<string, number>>(key)
      if (metrics) {
        const sampleSize = metrics._sampleSize || 0
        const { _sampleSize, ...cleanMetrics } = metrics
        results.push({ variantId, metrics: cleanMetrics, sampleSize })
      } else {
        results.push({ variantId, metrics: {}, sampleSize: 0 })
      }
    } catch (error) {
      // Fallback to in-memory
      const metrics = memoryStore.get(key)
      if (metrics) {
        const sampleSize = metrics._sampleSize || 0
        const { _sampleSize, ...cleanMetrics } = metrics
        results.push({ variantId, metrics: cleanMetrics, sampleSize })
      } else {
        results.push({ variantId, metrics: {}, sampleSize: 0 })
      }
    }
  }

  return results
}

/**
 * Clear in-memory store (for testing)
 */
export function clearMemoryStore(): void {
  memoryStore.clear()
}
