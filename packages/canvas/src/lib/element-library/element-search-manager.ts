interface CacheEntry {
  data: unknown
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

export async function searchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T
  }

  const data = await fetcher()
  cache.set(key, { data, timestamp: now })

  // Cleanup expired entries
  for (const [k, entry] of cache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL_MS) {
      cache.delete(k)
    }
  }

  return data
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, ms)
  }
}

export function clearCache(): void {
  cache.clear()
}
