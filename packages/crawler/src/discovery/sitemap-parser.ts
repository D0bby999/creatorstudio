/**
 * Sitemap XML parser with support for standard sitemaps and sitemap index files
 */

import * as cheerio from 'cheerio'
import type { SitemapEntry } from '../types/crawler-types.js'

/**
 * Parse sitemap XML content and extract URLs
 * Supports both standard sitemaps and sitemap index files
 */
export function parseSitemap(xmlContent: string): SitemapEntry[] {
  const entries: SitemapEntry[] = []

  try {
    const $ = cheerio.load(xmlContent, { xmlMode: true })

    // Check if this is a sitemap index
    const sitemapElements = $('sitemap')
    if (sitemapElements.length > 0) {
      // Parse sitemap index (contains references to other sitemaps)
      sitemapElements.each((_, elem) => {
        const loc = $(elem).find('loc').text().trim()
        if (loc) {
          entries.push({
            loc,
            // Sitemap index entries don't have lastmod/changefreq/priority
          })
        }
      })
      return entries
    }

    // Parse standard sitemap (contains URLs)
    const urlElements = $('url')
    urlElements.each((_, elem) => {
      const loc = $(elem).find('loc').text().trim()
      if (!loc) return

      const entry: SitemapEntry = { loc }

      // Parse optional fields
      const lastmod = $(elem).find('lastmod').text().trim()
      if (lastmod) {
        entry.lastmod = lastmod
      }

      const changefreq = $(elem).find('changefreq').text().trim()
      if (changefreq) {
        const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']
        if (validFreqs.includes(changefreq)) {
          entry.changefreq = changefreq as SitemapEntry['changefreq']
        }
      }

      const priority = $(elem).find('priority').text().trim()
      if (priority) {
        const num = parseFloat(priority)
        if (!isNaN(num) && num >= 0 && num <= 1) {
          entry.priority = num
        }
      }

      entries.push(entry)
    })
  } catch (error) {
    // Malformed XML - return empty array
    console.warn('Failed to parse sitemap XML:', error)
    return []
  }

  return entries
}

/**
 * Detect if sitemap content is a sitemap index (contains other sitemaps)
 */
export function isSitemapIndex(xmlContent: string): boolean {
  try {
    const $ = cheerio.load(xmlContent, { xmlMode: true })
    return $('sitemap').length > 0
  } catch {
    return false
  }
}

/**
 * Extract all sitemap URLs from a sitemap index
 */
export function extractSitemapUrls(xmlContent: string): string[] {
  const entries = parseSitemap(xmlContent)
  if (isSitemapIndex(xmlContent)) {
    return entries.map(e => e.loc)
  }
  return []
}
