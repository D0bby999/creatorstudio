import type { IncrementalResult } from '../types/crawler-types.js'

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Incremental crawler with change detection
 * Uses If-Modified-Since and If-None-Match headers to detect changes
 */
export class IncrementalCrawler {
  private cache = new Map<string, { hash: string; etag?: string; lastModified?: string }>()

  /**
   * Check if URL content has been modified
   * @param url - URL to check
   * @param previousHash - Optional previous content hash
   * @returns Incremental result with modification status
   */
  async checkModified(url: string, previousHash?: string): Promise<IncrementalResult> {
    const cached = this.cache.get(url)
    const headers: Record<string, string> = {}

    // Add conditional headers if we have previous data
    if (cached?.lastModified) {
      headers['If-Modified-Since'] = cached.lastModified
    }
    if (cached?.etag) {
      headers['If-None-Match'] = cached.etag
    }

    try {
      const response = await fetch(url, { headers })

      // 304 Not Modified - content hasn't changed
      if (response.status === 304) {
        return {
          modified: false,
          hash: previousHash || cached?.hash || '',
          statusCode: 304,
        }
      }

      // 200 OK - fetch content and compute hash
      if (response.status === 200) {
        const body = await response.text()
        const hash = hashString(body)

        // Cache headers for next check
        const etag = response.headers.get('etag') || undefined
        const lastModified = response.headers.get('last-modified') || undefined

        this.cache.set(url, { hash, etag, lastModified })

        // Compare with previous hash if provided
        const modified = previousHash ? hash !== previousHash : true

        return {
          modified,
          hash,
          statusCode: 200,
        }
      }

      // Other status codes - treat as modified
      return {
        modified: true,
        hash: '',
        statusCode: response.status,
      }
    } catch (error) {
      throw new Error(`Failed to check ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Clear cached data for URL
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}
