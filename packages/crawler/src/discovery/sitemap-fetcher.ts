/**
 * Sitemap fetcher with auto-discovery and robots.txt parsing
 */

import type { SitemapEntry } from '../types/crawler-types.js'
import { parseSitemap, isSitemapIndex, extractSitemapUrls } from './sitemap-parser.js'
import { parseRobotsTxt } from './robots-txt-parser.js'

export interface SitemapFetcherConfig {
  timeout?: number  // default: 10000ms
  maxSitemaps?: number  // default: 10 (prevent infinite recursion)
}

/**
 * Fetch and parse all sitemaps from a domain
 * Auto-discovers sitemaps via /sitemap.xml and robots.txt
 */
export async function fetchSitemapUrls(
  baseUrl: string,
  config: SitemapFetcherConfig = {}
): Promise<SitemapEntry[]> {
  const { timeout = 10000, maxSitemaps = 10 } = config
  const allEntries: SitemapEntry[] = []
  const visited = new Set<string>()

  try {
    const base = new URL(baseUrl)
    const sitemapUrls: string[] = []

    // Try /sitemap.xml first
    const defaultSitemap = new URL('/sitemap.xml', base).toString()
    sitemapUrls.push(defaultSitemap)

    // Try robots.txt for sitemap declarations
    try {
      const robotsUrl = new URL('/robots.txt', base).toString()
      const robotsTxt = await fetchWithTimeout(robotsUrl, timeout)
      const rules = parseRobotsTxt(robotsTxt)
      sitemapUrls.push(...rules.sitemaps)
    } catch {
      // robots.txt not found or failed - continue
    }

    // Fetch all discovered sitemaps
    for (const sitemapUrl of sitemapUrls) {
      if (visited.size >= maxSitemaps) break
      await fetchSitemapRecursive(sitemapUrl, allEntries, visited, timeout, maxSitemaps)
    }
  } catch (error) {
    console.warn('Failed to fetch sitemaps:', error)
  }

  return allEntries
}

/**
 * Recursively fetch sitemap (handles sitemap index files)
 */
async function fetchSitemapRecursive(
  sitemapUrl: string,
  entries: SitemapEntry[],
  visited: Set<string>,
  timeout: number,
  maxSitemaps: number
): Promise<void> {
  if (visited.has(sitemapUrl) || visited.size >= maxSitemaps) {
    return
  }

  visited.add(sitemapUrl)

  try {
    let content = await fetchWithTimeout(sitemapUrl, timeout)

    // Handle gzip sitemaps (.xml.gz)
    if (sitemapUrl.endsWith('.gz')) {
      // Note: For gzip, would need decompression library
      // For now, skip gzipped sitemaps in this simple implementation
      console.warn('Gzipped sitemaps not supported yet:', sitemapUrl)
      return
    }

    const parsed = parseSitemap(content)

    if (isSitemapIndex(content)) {
      // This is a sitemap index - fetch nested sitemaps
      const nestedUrls = extractSitemapUrls(content)
      for (const nestedUrl of nestedUrls) {
        if (visited.size >= maxSitemaps) break
        await fetchSitemapRecursive(nestedUrl, entries, visited, timeout, maxSitemaps)
      }
    } else {
      // Regular sitemap - add entries
      entries.push(...parsed)
    }
  } catch (error) {
    console.warn(`Failed to fetch sitemap ${sitemapUrl}:`, error)
  }
}

/**
 * Fetch URL with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Creator Studio Crawler/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeoutId)
  }
}
