import type { ScrapedContent } from '../types/crawler-types'

/**
 * Export scraped content to JSON format
 * @param data - Array of scraped content
 * @returns JSON string with 2-space indentation
 */
export function exportToJson(data: ScrapedContent[]): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Export scraped content to CSV format
 * @param data - Array of scraped content
 * @returns CSV string with headers and escaped fields
 */
export function exportToCsv(data: ScrapedContent[]): string {
  const headers = [
    'url',
    'title',
    'description',
    'headingsCount',
    'imagesCount',
    'linksCount',
    'scrapedAt',
  ]

  /**
   * Escape CSV field value (handle commas, quotes, newlines)
   */
  const escapeField = (val: string): string => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const rows = data.map(item => [
    escapeField(item.url),
    escapeField(item.title),
    escapeField(item.description),
    String(item.headings.length),
    String(item.images.length),
    String(item.links.length),
    escapeField(item.scrapedAt),
  ].join(','))

  return [headers.join(','), ...rows].join('\n')
}
