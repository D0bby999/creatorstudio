// Typed cache helpers with JSON serialization, TTL, and in-memory fallback
// All operations gracefully degrade when Redis is unavailable

import { getRedis } from './redis-client'

// In-memory fallback store for dev mode with LRU eviction
const MAX_MEMORY_ENTRIES = 10_000
const memoryStore = new Map<string, { value: string; expiresAt?: number }>()

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis()

  if (redis) {
    const value = await redis.get<T>(key)
    return value ?? null
  }

  // Fallback: in-memory — move to end for LRU on access
  const entry = memoryStore.get(key)
  if (!entry) return null
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryStore.delete(key)
    return null
  }
  memoryStore.delete(key)
  memoryStore.set(key, entry)
  return JSON.parse(entry.value) as T
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const redis = getRedis()

  if (redis) {
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds })
    } else {
      await redis.set(key, value)
    }
    return
  }

  // Fallback: in-memory with LRU eviction (least recently used = first in Map)
  if (memoryStore.size >= MAX_MEMORY_ENTRIES) {
    const oldestKey = memoryStore.keys().next().value
    if (oldestKey) {
      memoryStore.delete(oldestKey)
    }
  }

  memoryStore.set(key, {
    value: JSON.stringify(value),
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  })
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis()

  if (redis) {
    await redis.del(key)
    return
  }

  memoryStore.delete(key)
}

/**
 * Get all values matching a key prefix.
 * Uses SCAN in Redis, prefix filter in memory fallback.
 */
export async function cacheGetByPrefix<T>(prefix: string): Promise<T[]> {
  const redis = getRedis()

  if (redis) {
    const keys: string[] = []
    let cursor = 0
    do {
      const result = await redis.scan(cursor, { match: `${prefix}*`, count: 100 })
      cursor = Number(result[0])
      const batch = result[1] as string[]
      keys.push(...batch)
    } while (cursor !== 0)

    if (keys.length === 0) return []
    const values = await redis.mget<T[]>(...keys)
    return values.filter((v): v is T => v !== null)
  }

  // Fallback: in-memory prefix scan
  const now = Date.now()
  const results: T[] = []
  for (const [key, entry] of memoryStore) {
    if (!key.startsWith(prefix)) continue
    if (entry.expiresAt && now > entry.expiresAt) {
      memoryStore.delete(key)
      continue
    }
    results.push(JSON.parse(entry.value) as T)
  }
  return results
}

/**
 * Clear all in-memory fallback entries (for testing)
 */
export function clearMemoryStore(): void {
  memoryStore.clear()
}
