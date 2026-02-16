import * as cheerio from 'cheerio'
import type { JsonLdData } from '../types/crawler-types'

/**
 * Extracts JSON-LD structured data from HTML
 * @param html - HTML string to parse
 * @returns Array of JSON-LD objects
 */
export function extractJsonLd(html: string): JsonLdData[] {
  const $ = cheerio.load(html)
  const jsonLdData: JsonLdData[] = []

  // Find all script tags with type="application/ld+json"
  $('script[type="application/ld+json"]').each((_, element) => {
    const content = $(element).html()
    if (!content) return

    try {
      // Parse JSON content
      const parsed = JSON.parse(content.trim())

      // Handle both single objects and arrays
      if (Array.isArray(parsed)) {
        jsonLdData.push(...parsed)
      } else if (typeof parsed === 'object' && parsed !== null) {
        jsonLdData.push(parsed)
      }
    } catch (error) {
      // Gracefully handle malformed JSON
      console.warn('Failed to parse JSON-LD:', error instanceof Error ? error.message : 'Unknown error')
    }
  })

  return jsonLdData
}

/**
 * Extracts specific JSON-LD types from HTML
 * @param html - HTML string to parse
 * @param types - Array of @type values to filter by (e.g., ['Organization', 'WebSite'])
 * @returns Filtered JSON-LD objects
 */
export function extractJsonLdByType(html: string, types: string[]): JsonLdData[] {
  const allData = extractJsonLd(html)
  const typesSet = new Set(types)

  return allData.filter((item) => {
    const itemType = item['@type']
    if (!itemType) return false

    // Handle both string and array @type values
    if (Array.isArray(itemType)) {
      return itemType.some((t) => typesSet.has(t))
    }
    return typesSet.has(itemType)
  })
}
