/**
 * Token usage tracking with per-call breakdown and cost estimation
 * Stores usage records in Redis (session-scoped, 24h TTL)
 */

import { cacheGet, cacheSet } from '@creator-studio/redis/cache'
import type { TokenUsageRecord } from '../types/ai-types'

const USAGE_PREFIX = 'ai:usage:'
const USAGE_TTL = 86400 // 24h

// Per-1K token pricing (USD) — last updated 2026-02
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'claude-3-5-haiku-latest': { input: 0.0008, output: 0.004 },
  'claude-3-5-sonnet-latest': { input: 0.003, output: 0.015 },
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'gemini-2.0-pro': { input: 0.00125, output: 0.005 },
}

/** Estimate cost in USD for a given usage + model */
export function estimateCost(
  usage: { promptTokens: number; completionTokens: number },
  modelId: string,
  details?: { cacheReadTokens?: number; reasoningTokens?: number }
): number {
  const pricing = MODEL_PRICING[modelId]
  if (!pricing) return 0

  // Discount cached tokens (50% for OpenAI cached input tokens)
  const cacheDiscount = (details?.cacheReadTokens ?? 0) * pricing.input * 0.5 / 1000
  const cost = (usage.promptTokens * pricing.input + usage.completionTokens * pricing.output) / 1000 - cacheDiscount
  return Math.round(Math.max(0, cost) * 10000) / 10000 // 4 decimal places
}

/** Store a usage record for a session */
export async function trackUsage(sessionId: string, record: Omit<TokenUsageRecord, 'sessionId'>): Promise<void> {
  const key = `${USAGE_PREFIX}${sessionId}`

  try {
    const existing = await cacheGet<TokenUsageRecord[]>(key) ?? []
    existing.push({ ...record, sessionId })
    await cacheSet(key, existing, USAGE_TTL)
  } catch {
    // Redis unavailable — skip tracking silently
  }
}

/** Get all usage records for a session */
export async function getUsage(sessionId: string): Promise<TokenUsageRecord[]> {
  try {
    return await cacheGet<TokenUsageRecord[]>(`${USAGE_PREFIX}${sessionId}`) ?? []
  } catch {
    return []
  }
}

/** Get aggregated daily usage for a user (sum across all sessions) */
export async function getUserDailyUsage(userId: string): Promise<{ totalTokens: number; estimatedCostUsd: number }> {
  try {
    const records = await cacheGet<TokenUsageRecord[]>(`${USAGE_PREFIX}${userId}`) ?? []
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayMs = todayStart.getTime()

    const todayRecords = records.filter(r => r.timestamp >= todayMs)
    return {
      totalTokens: todayRecords.reduce((sum, r) => sum + r.totalTokens, 0),
      estimatedCostUsd: todayRecords.reduce((sum, r) => sum + r.estimatedCostUsd, 0),
    }
  } catch {
    return { totalTokens: 0, estimatedCostUsd: 0 }
  }
}

/** Check if user is under the daily token limit */
export async function checkLimit(userId: string, limit: number): Promise<boolean> {
  const { totalTokens } = await getUserDailyUsage(userId)
  return totalTokens < limit
}
