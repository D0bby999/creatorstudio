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

// In-memory fallback for dev mode with LRU eviction
const MAX_MEMORY_ENTRIES = 10_000
const memoryWindows = new Map<string, { count: number; resetAt: number }>()

// Singleton cache keyed by maxRequests-windowSeconds
const ratelimiters = new Map<string, Ratelimit>()

function getOrCreateLimiter(maxRequests: number, windowSeconds: number): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null

  const key = `${maxRequests}-${windowSeconds}`

  if (!ratelimiters.has(key)) {
    ratelimiters.set(key, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      prefix: 'rate',
    }))
  }

  return ratelimiters.get(key)!
}

/**
 * Check rate limit for an API key.
 * Throws 429 Response if exceeded (matches existing behavior).
 */
export async function checkRateLimit(apiKeyId: string, limit = 10, windowSeconds = 60): Promise<void> {
  const rl = getOrCreateLimiter(limit, windowSeconds)

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

  // Fallback: in-memory sliding window with LRU eviction
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = memoryWindows.get(apiKeyId)

  if (!existing || existing.resetAt <= now) {
    // LRU eviction before inserting new entry
    if (memoryWindows.size >= MAX_MEMORY_ENTRIES) {
      const oldestKey = memoryWindows.keys().next().value
      if (oldestKey) {
        memoryWindows.delete(oldestKey)
      }
    }
    memoryWindows.set(apiKeyId, { count: 1, resetAt: now + windowMs })
    return
  }

  // Move accessed entry to end of Map (LRU: most recently used at end)
  memoryWindows.delete(apiKeyId)
  memoryWindows.set(apiKeyId, existing)

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
 * Get rate limit info without consuming a request (memory-only tracking)
 * For API routes to set response headers without consuming quota
 */
export async function getRateLimitInfo(apiKeyId: string, limit = 10, windowSeconds = 60): Promise<RateLimitResult> {
  // Memory-only check - does NOT consume a request
  const existing = memoryWindows.get(apiKeyId)
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  return {
    success: !existing || existing.count < limit || existing.resetAt <= now,
    limit,
    remaining: existing ? Math.max(0, limit - existing.count) : limit,
    reset: existing?.resetAt ?? now + windowMs,
  }
}

/**
 * Reset rate limiter (for testing)
 */
export function resetRateLimiter(): void {
  ratelimiters.clear()
  memoryWindows.clear()
}
