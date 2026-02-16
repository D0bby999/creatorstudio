import * as cheerio from 'cheerio'
import type { OpenGraphData } from '../types/crawler-types'

/**
 * Extracts Open Graph and Twitter Card metadata from HTML
 * @param html - HTML string to parse
 * @returns Object containing Open Graph data
 */
export function extractOpenGraph(html: string): OpenGraphData {
  const $ = cheerio.load(html)
  const ogData: OpenGraphData = {}

  // Extract Open Graph meta tags (og:*)
  $('meta[property^="og:"]').each((_, element) => {
    const property = $(element).attr('property')
    const content = $(element).attr('content')

    if (!property || !content) return

    // Convert og:title to title, og:description to description, etc.
    const key = property.replace('og:', '')

    // Convert kebab-case to camelCase (e.g., site-name -> siteName)
    const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

    ogData[camelKey] = content
  })

  // Extract Twitter Card meta tags (twitter:*) as fallback
  $('meta[name^="twitter:"]').each((_, element) => {
    const name = $(element).attr('name')
    const content = $(element).attr('content')

    if (!name || !content) return

    const key = name.replace('twitter:', '')
    const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

    // Only set if not already set by Open Graph
    if (!ogData[camelKey]) {
      ogData[camelKey] = content
    }
  })

  return ogData
}
