// Upstash Redis client singleton with graceful fallback for dev mode
// Uses HTTP/REST API — works in Vercel serverless without connection pooling

import { Redis } from '@upstash/redis'

let redis: Redis | null = null
let fallbackMode = false

/**
 * Get or create Upstash Redis client.
 * Returns null if env vars missing (dev mode fallback).
 */
export function getRedis(): Redis | null {
  if (fallbackMode) return null
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    fallbackMode = true
    console.warn('[redis] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory fallback')
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

/**
 * Check if Redis is available (not in fallback mode)
 */
export function isRedisAvailable(): boolean {
  return !fallbackMode && !!getRedis()
}

/**
 * Reset client (useful for testing)
 */
export function resetRedisClient(): void {
  redis = null
  fallbackMode = false
}
