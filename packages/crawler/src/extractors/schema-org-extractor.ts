import * as cheerio from 'cheerio'
import type { SchemaOrgData } from '../types/crawler-types'

/**
 * Extracts Schema.org microdata from HTML
 * @param html - HTML string to parse
 * @returns Array of Schema.org structured data objects
 */
export function extractSchemaOrg(html: string): SchemaOrgData[] {
  const $ = cheerio.load(html)
  const schemaData: SchemaOrgData[] = []

  // Find all elements with itemscope attribute
  $('[itemscope]').each((_, element) => {
    const $element = $(element)

    // Skip nested itemscopes (process them recursively)
    if ($element.parents('[itemscope]').length > 0) return

    const item = parseItemScope($, $element)
    if (item) {
      schemaData.push(item)
    }
  })

  return schemaData
}

/**
 * Recursively parse an itemscope element
 */
function parseItemScope($: cheerio.CheerioAPI, $element: cheerio.Cheerio<any>): SchemaOrgData | null {
  const itemType = $element.attr('itemtype')
  if (!itemType) return null

  // Extract type from itemtype URL (e.g., https://schema.org/Organization -> Organization)
  const type = itemType.split('/').pop() || 'Unknown'
  const properties: Record<string, string | SchemaOrgData> = {}

  // Find all itemprop elements within this itemscope
  $element.find('[itemprop]').each((_, propElement) => {
    const $prop = $(propElement)

    // Skip if this property belongs to a nested itemscope
    const $closestScope = $prop.closest('[itemscope]')
    if (!$closestScope.is($element)) return

    const propName = $prop.attr('itemprop')
    if (!propName) return

    // Check if this property has its own itemscope (nested object)
    if ($prop.attr('itemscope')) {
      const nestedItem = parseItemScope($, $prop)
      if (nestedItem) {
        properties[propName] = nestedItem
      }
    } else {
      // Extract value based on element type
      let value = ''
      const tagName = propElement.tagName.toLowerCase()

      if (tagName === 'meta') {
        value = $prop.attr('content') || ''
      } else if (tagName === 'a' || tagName === 'link') {
        value = $prop.attr('href') || ''
      } else if (tagName === 'img') {
        value = $prop.attr('src') || ''
      } else {
        value = $prop.text().trim()
      }

      properties[propName] = value
    }
  })

  return { type, properties }
}
