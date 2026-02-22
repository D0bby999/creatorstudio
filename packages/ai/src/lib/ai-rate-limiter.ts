/**
 * AI-specific rate limiting with tier-based quotas
 * Enforces per-minute request limits and daily token quotas
 */

import { checkRateLimit } from '@creator-studio/redis/rate-limiter'
import { cacheGet, cacheSet } from '@creator-studio/redis/cache'
import { getUserDailyUsage } from './token-usage-tracker'

export type UserTier = 'free' | 'pro' | 'enterprise'

export interface AiRateLimitResult {
  allowed: boolean
  remaining: { tokens: number; requests: number }
  reset: number
  tier: UserTier
}

export interface AiUsageStatus {
  tier: UserTier
  tokensUsed: number
  tokensLimit: number
  tokensRemaining: number
  requestsRemaining: number
}

/** Default tier limits (override via env vars) */
const DEFAULT_LIMITS: Record<UserTier, { tokensPerDay: number; requestsPerMinute: number }> = {
  free: { tokensPerDay: 5_000, requestsPerMinute: 5 },
  pro: { tokensPerDay: 100_000, requestsPerMinute: 30 },
  enterprise: { tokensPerDay: 1_000_000, requestsPerMinute: 100 },
}

/** Get tier limits with env var overrides */
function getTierLimits(tier: UserTier): { tokensPerDay: number; requestsPerMinute: number } {
  const envTokens = process.env[`AI_RATE_LIMIT_${tier.toUpperCase()}_TOKENS`]
  const envRpm = process.env[`AI_RATE_LIMIT_${tier.toUpperCase()}_RPM`]

  const parsedTokens = envTokens ? parseInt(envTokens, 10) : NaN
  const parsedRpm = envRpm ? parseInt(envRpm, 10) : NaN

  return {
    tokensPerDay: Number.isFinite(parsedTokens) ? parsedTokens : DEFAULT_LIMITS[tier].tokensPerDay,
    requestsPerMinute: Number.isFinite(parsedRpm) ? parsedRpm : DEFAULT_LIMITS[tier].requestsPerMinute,
  }
}

/** Custom error for rate limit exceeded */
export class AiRateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number
  ) {
    super(message)
    this.name = 'AiRateLimitError'
  }
}

/** Check both RPM and daily token limits */
export async function checkAiRateLimit(userId: string, tier: UserTier = 'free'): Promise<AiRateLimitResult> {
  const limits = getTierLimits(tier)
  let requestsRemaining = limits.requestsPerMinute
  let resetTime = Date.now() + 60_000

  // Check RPM limit (checkRateLimit throws Response on exceeded)
  try {
    await checkRateLimit(userId, limits.requestsPerMinute, 60)
  } catch (error) {
    // If it's a Response (rate limit exceeded), throw AiRateLimitError instead
    if (error instanceof Response) {
      const retryAfter = parseInt(error.headers.get('Retry-After') || '60', 10)
      const reset = parseInt(error.headers.get('X-RateLimit-Reset') || String(resetTime), 10)
      throw new AiRateLimitError(
        `Rate limit exceeded: ${limits.requestsPerMinute} requests per minute`,
        retryAfter,
        limits.requestsPerMinute,
        0
      )
    }
    // Redis unavailable — gracefully allow
    requestsRemaining = limits.requestsPerMinute
  }

  // Check daily token limit
  let tokensUsed = 0
  try {
    const usage = await getUserDailyUsage(userId)
    tokensUsed = usage.totalTokens

    if (tokensUsed >= limits.tokensPerDay) {
      // Calculate reset time (midnight UTC)
      const tomorrow = new Date()
      tomorrow.setUTCHours(24, 0, 0, 0)
      const retryAfter = Math.ceil((tomorrow.getTime() - Date.now()) / 1000)

      throw new AiRateLimitError(
        `Daily token limit exceeded: ${limits.tokensPerDay} tokens`,
        retryAfter,
        limits.tokensPerDay,
        0
      )
    }
  } catch (error) {
    // If it's already AiRateLimitError, re-throw
    if (error instanceof AiRateLimitError) {
      throw error
    }
    // Redis unavailable — gracefully allow
    tokensUsed = 0
  }

  return {
    allowed: true,
    remaining: {
      tokens: Math.max(0, limits.tokensPerDay - tokensUsed),
      requests: requestsRemaining,
    },
    reset: resetTime,
    tier,
  }
}

/** Record AI usage (increment daily token counter) */
export async function recordAiUsage(userId: string, tokensUsed: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const key = `ai:daily:${userId}:${today}`

  try {
    const current = await cacheGet<number>(key) ?? 0
    await cacheSet(key, current + tokensUsed, 86400) // 24h TTL
  } catch {
    // Redis unavailable — skip recording silently
  }
}

/** Get current usage status for a user */
export async function getAiUsageStatus(userId: string, tier: UserTier = 'free'): Promise<AiUsageStatus> {
  const limits = getTierLimits(tier)
  let tokensUsed = 0

  try {
    const usage = await getUserDailyUsage(userId)
    tokensUsed = usage.totalTokens
  } catch {
    // Redis unavailable — return zero usage
  }

  return {
    tier,
    tokensUsed,
    tokensLimit: limits.tokensPerDay,
    tokensRemaining: Math.max(0, limits.tokensPerDay - tokensUsed),
    requestsRemaining: limits.requestsPerMinute, // Per-minute limit (no persistence)
  }
}
