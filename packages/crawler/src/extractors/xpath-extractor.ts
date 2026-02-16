import * as cheerio from 'cheerio'
import type { XPathConfig } from '../types/crawler-types'

/**
 * Extracts data from HTML using XPath-like expressions
 * Note: This is a simplified implementation that translates basic XPath to CSS selectors
 * Full XPath support would require a dedicated XPath library
 * @param html - HTML string to parse
 * @param expressions - Array of XPath configurations
 * @returns Object with extracted data keyed by expression name
 */
export function extractByXPath(
  html: string,
  expressions: XPathConfig[]
): Record<string, string | string[]> {
  const $ = cheerio.load(html)
  const results: Record<string, string | string[]> = {}

  for (const config of expressions) {
    const { name, expression, multiple = false } = config

    try {
      // Attempt to translate XPath to CSS selector
      const cssSelector = translateXPathToCSS(expression)
      const $elements = $(cssSelector)

      if ($elements.length === 0) {
        results[name] = multiple ? [] : ''
        continue
      }

      if (multiple) {
        const values: string[] = []
        $elements.each((_, element) => {
          values.push($(element).text().trim())
        })
        results[name] = values
      } else {
        results[name] = $elements.first().text().trim()
      }
    } catch (error) {
      console.warn(`XPath expression not supported: ${expression}`, error instanceof Error ? error.message : 'Unknown error')
      results[name] = multiple ? [] : ''
    }
  }

  return results
}

/**
 * Translate basic XPath expressions to CSS selectors
 * Supports simple cases only; complex XPath features are not supported
 */
function translateXPathToCSS(xpath: string): string {
  // Remove leading slashes
  let path = xpath.replace(/^\/+/, '')

  // Replace // with space (descendant)
  path = path.replace(/\/\//g, ' ')

  // Replace / with > (child)
  path = path.replace(/\//g, ' > ')

  // Handle [@attribute='value'] -> [attribute='value']
  path = path.replace(/@/g, '')

  // Handle text() (remove it as CSS doesn't have equivalent)
  path = path.replace(/\/text\(\)/g, '')

  return path
}
