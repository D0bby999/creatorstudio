/**
 * AI generation cache middleware
 * Caches generateObject results in Redis, skips streaming
 */

import { createHash } from 'crypto'
import type { LanguageModelV1Middleware } from 'ai'
import { cacheGet, cacheSet } from '@creator-studio/redis/cache'

const CACHE_PREFIX = 'ai:cache:'
const DEFAULT_TTL = 3600 // 1 hour

interface CacheMiddlewareOptions {
  ttl?: number
  prefix?: string
}

function hashParams(params: Record<string, unknown>): string {
  const serialized = JSON.stringify({
    model: params.modelId,
    prompt: params.prompt,
    messages: params.messages,
    mode: params.mode,
  })
  return createHash('sha256').update(serialized).digest('hex').slice(0, 16)
}

export function createCacheMiddleware(options?: CacheMiddlewareOptions): LanguageModelV1Middleware {
  const ttl = options?.ttl ?? DEFAULT_TTL
  const prefix = options?.prefix ?? CACHE_PREFIX

  return {
    wrapGenerate: async ({ doGenerate, params }) => {
      const key = `${prefix}${hashParams(params as Record<string, unknown>)}`

      try {
        const cached = await cacheGet<Awaited<ReturnType<typeof doGenerate>>>(key)
        if (cached) return cached
      } catch {
        // Redis unavailable — pass through
      }

      const result = await doGenerate()

      try {
        await cacheSet(key, result, ttl)
      } catch {
        // Redis unavailable — skip caching
      }

      return result
    },
    // Streaming is not cached (responses are unique per stream)
  }
}
