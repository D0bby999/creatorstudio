export type CacheStrategy = 'immutable' | 'no-cache' | 'short-cache' | 'medium-cache'

const strategies: Record<CacheStrategy, string> = {
  immutable: 'public, max-age=31536000, immutable',
  'no-cache': 'private, no-store, must-revalidate',
  'short-cache': 'public, max-age=60, must-revalidate',
  'medium-cache': 'public, max-age=300, must-revalidate',
}

export function getCacheHeaders(strategy: CacheStrategy): HeadersInit {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return { 'Cache-Control': 'no-cache' }
  }

  return { 'Cache-Control': strategies[strategy] }
}

export function withCacheHeaders(strategy: CacheStrategy, headers?: HeadersInit): Headers {
  const result = new Headers(headers)
  const cacheHeaders = getCacheHeaders(strategy)
  for (const [key, value] of Object.entries(cacheHeaders)) {
    result.set(key, value)
  }
  return result
}
