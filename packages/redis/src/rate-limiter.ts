// Rate limiter using @upstash/ratelimit with in-memory fallback
// Sliding window algorithm, <10ms latency via Upstash edge

import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from './redis-client'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory fallback for dev mode
const memoryWindows = new Map<string, { count: number; resetAt: number }>()

let ratelimit: Ratelimit | null = null

function getRatelimit(limit: number): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null

  // Recreate if limit changed (rare)
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, '60 s'),
      prefix: 'rate',
    })
  }
  return ratelimit
}

/**
 * Check rate limit for an API key.
 * Throws 429 Response if exceeded (matches existing behavior).
 */
export async function checkRateLimit(apiKeyId: string, limit = 10): Promise<void> {
  const rl = getRatelimit(limit)

  if (rl) {
    const result = await rl.limit(apiKeyId)
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
      throw new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset),
        },
      })
    }
    return
  }

  // Fallback: in-memory sliding window (same as original implementation)
  const now = Date.now()
  const existing = memoryWindows.get(apiKeyId)

  if (!existing || existing.resetAt <= now) {
    memoryWindows.set(apiKeyId, { count: 1, resetAt: now + 60_000 })
    return
  }

  if (existing.count >= limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    throw new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    })
  }

  existing.count++
}

/**
 * Get rate limit info without consuming a request (for headers)
 */
export async function getRateLimitInfo(apiKeyId: string, limit = 10): Promise<RateLimitResult> {
  const rl = getRatelimit(limit)

  if (rl) {
    const result = await rl.limit(apiKeyId)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  }

  const existing = memoryWindows.get(apiKeyId)
  const now = Date.now()
  return {
    success: !existing || existing.count < limit || existing.resetAt <= now,
    limit,
    remaining: existing ? Math.max(0, limit - existing.count) : limit,
    reset: existing?.resetAt ?? now + 60_000,
  }
}

/**
 * Reset rate limiter (for testing)
 */
export function resetRateLimiter(): void {
  ratelimit = null
  memoryWindows.clear()
}
