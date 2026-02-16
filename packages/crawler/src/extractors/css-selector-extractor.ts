import * as cheerio from 'cheerio'
import type { CssSelectorConfig } from '../types/crawler-types'

/**
 * Extracts data from HTML using CSS selectors
 * @param html - HTML string to parse
 * @param selectors - Array of CSS selector configurations
 * @returns Object with extracted data keyed by selector name
 */
export function extractByCssSelector(
  html: string,
  selectors: CssSelectorConfig[]
): Record<string, string | string[]> {
  const $ = cheerio.load(html)
  const results: Record<string, string | string[]> = {}

  for (const config of selectors) {
    const { name, selector, attribute, multiple = false } = config
    const $elements = $(selector)

    if ($elements.length === 0) {
      results[name] = multiple ? [] : ''
      continue
    }

    if (multiple) {
      // Extract from all matching elements
      const values: string[] = []
      $elements.each((_, element) => {
        const value = extractValue($, $(element), attribute)
        if (value) values.push(value)
      })
      results[name] = values
    } else {
      // Extract from first matching element only
      const value = extractValue($, $elements.first(), attribute)
      results[name] = value || ''
    }
  }

  return results
}

/**
 * Extract value from an element based on attribute or text content
 */
function extractValue($: cheerio.CheerioAPI, $element: cheerio.Cheerio<any>, attribute?: string): string {
  if (!attribute) {
    return $element.text().trim()
  }

  return $element.attr(attribute) || ''
}
