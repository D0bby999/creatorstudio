import type { ExtractionConfig, ExtractedData } from '../types/crawler-types'
import { extractJsonLd } from './json-ld-extractor'
import { extractOpenGraph } from './open-graph-extractor'
import { extractSchemaOrg } from './schema-org-extractor'
import { extractTables } from './table-extractor'
import { extractByCssSelector } from './css-selector-extractor'
import { extractByXPath } from './xpath-extractor'

/**
 * Runs multiple extractors based on configuration
 * @param html - HTML string to parse
 * @param config - Extraction configuration specifying which extractors to run
 * @returns Unified extracted data object
 */
export function runExtractionPipeline(html: string, config: ExtractionConfig): ExtractedData {
  const result: ExtractedData = {}

  try {
    // JSON-LD extraction
    if (config.jsonLd) {
      result.jsonLd = extractJsonLd(html)
    }

    // Open Graph extraction
    if (config.openGraph) {
      result.openGraph = extractOpenGraph(html)
    }

    // Schema.org microdata extraction
    if (config.schemaOrg) {
      result.schemaOrg = extractSchemaOrg(html)
    }

    // Table extraction
    if (config.tables) {
      result.tables = extractTables(html)
    }

    // CSS selector extraction
    if (config.cssSelectors && config.cssSelectors.length > 0) {
      result.cssSelectors = extractByCssSelector(html, config.cssSelectors)
    }

    // XPath extraction
    if (config.xpathExpressions && config.xpathExpressions.length > 0) {
      result.xpath = extractByXPath(html, config.xpathExpressions)
    }
  } catch (error) {
    console.error('Extraction pipeline error:', error instanceof Error ? error.message : 'Unknown error')
    // Return partial results even if some extractors fail
  }

  return result
}

/**
 * Runs all available extractors on HTML
 * @param html - HTML string to parse
 * @returns Complete extracted data with all extractors enabled
 */
export function extractAll(html: string): ExtractedData {
  return runExtractionPipeline(html, {
    jsonLd: true,
    openGraph: true,
    schemaOrg: true,
    tables: true,
  })
}
