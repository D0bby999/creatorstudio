/**
 * Usage Analytics Aggregator
 * Aggregates token usage data across time ranges with model/provider breakdowns
 */

import { cacheGet } from '@creator-studio/redis/cache'
import type { TokenUsageRecord } from '../types/ai-types'

type TimeRange = 'day' | 'week' | 'month'

interface UsageSummary {
  period: { start: number; end: number }
  totalTokens: number
  totalCostUsd: number
  requestCount: number
  byModel: Record<string, { tokens: number; costUsd: number; count: number }>
  byProvider: Record<string, { tokens: number; costUsd: number; count: number }>
}

/** Get timestamp range for given time period */
export function getTimeRange(range: TimeRange): { start: number; end: number } {
  const now = Date.now()
  const start = new Date()

  switch (range) {
    case 'day':
      start.setUTCHours(0, 0, 0, 0)
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      start.setUTCHours(0, 0, 0, 0)
      break
    case 'month':
      start.setDate(start.getDate() - 30)
      start.setUTCHours(0, 0, 0, 0)
      break
  }

  return { start: start.getTime(), end: now }
}

/** Get usage summary for user within time range */
export async function getUsageSummary(userId: string, range: TimeRange): Promise<UsageSummary> {
  const { start, end } = getTimeRange(range)
  const byModel: Record<string, { tokens: number; costUsd: number; count: number }> = {}
  const byProvider: Record<string, { tokens: number; costUsd: number; count: number }> = {}

  try {
    const records = await cacheGet<TokenUsageRecord[]>(`ai:usage:${userId}`) ?? []
    const filtered = records.filter(r => r.timestamp >= start && r.timestamp <= end)

    let totalTokens = 0
    let totalCostUsd = 0

    for (const record of filtered) {
      totalTokens += record.totalTokens
      totalCostUsd += record.estimatedCostUsd

      // Group by model
      if (!byModel[record.model]) {
        byModel[record.model] = { tokens: 0, costUsd: 0, count: 0 }
      }
      byModel[record.model].tokens += record.totalTokens
      byModel[record.model].costUsd += record.estimatedCostUsd
      byModel[record.model].count += 1

      // Group by provider
      if (!byProvider[record.provider]) {
        byProvider[record.provider] = { tokens: 0, costUsd: 0, count: 0 }
      }
      byProvider[record.provider].tokens += record.totalTokens
      byProvider[record.provider].costUsd += record.estimatedCostUsd
      byProvider[record.provider].count += 1
    }

    return {
      period: { start, end },
      totalTokens,
      totalCostUsd: Math.round(totalCostUsd * 10000) / 10000, // 4 decimals
      requestCount: filtered.length,
      byModel,
      byProvider,
    }
  } catch {
    // Redis unavailable or other error - return empty summary
    return {
      period: { start, end },
      totalTokens: 0,
      totalCostUsd: 0,
      requestCount: 0,
      byModel: {},
      byProvider: {},
    }
  }
}

/** Get top N models by token usage */
export async function getTopModels(
  userId: string,
  range: TimeRange,
  limit = 5
): Promise<Array<{ model: string; tokens: number; costUsd: number }>> {
  const summary = await getUsageSummary(userId, range)

  return Object.entries(summary.byModel)
    .map(([model, stats]) => ({
      model,
      tokens: stats.tokens,
      costUsd: stats.costUsd,
    }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, limit)
}

/** Get daily usage trend over N days */
export async function getUsageTrend(
  userId: string,
  days: number
): Promise<Array<{ date: string; tokens: number; costUsd: number }>> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  try {
    const records = await cacheGet<TokenUsageRecord[]>(`ai:usage:${userId}`) ?? []
    const filtered = records.filter(r => r.timestamp >= startDate.getTime())

    // Group by date (YYYY-MM-DD)
    const byDate: Record<string, { tokens: number; costUsd: number }> = {}

    for (const record of filtered) {
      const date = new Date(record.timestamp)
      const dateKey = date.toISOString().split('T')[0]

      if (!byDate[dateKey]) {
        byDate[dateKey] = { tokens: 0, costUsd: 0 }
      }
      byDate[dateKey].tokens += record.totalTokens
      byDate[dateKey].costUsd += record.estimatedCostUsd
    }

    // Convert to sorted array
    return Object.entries(byDate)
      .map(([date, stats]) => ({
        date,
        tokens: stats.tokens,
        costUsd: Math.round(stats.costUsd * 10000) / 10000,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}
