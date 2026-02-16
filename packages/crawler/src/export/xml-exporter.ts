import type { DatasetItem } from '../types/crawler-types.js'

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Convert object to XML elements recursively
 */
function objectToXml(obj: any, indent = 2): string {
  const spaces = ' '.repeat(indent)
  const lines: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue

    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_')

    if (Array.isArray(value)) {
      lines.push(`${spaces}<${safeKey}>`)
      value.forEach(item => {
        if (typeof item === 'object') {
          lines.push(`${spaces}  <item>`)
          lines.push(objectToXml(item, indent + 4))
          lines.push(`${spaces}  </item>`)
        } else {
          lines.push(`${spaces}  <item>${escapeXml(String(item))}</item>`)
        }
      })
      lines.push(`${spaces}</${safeKey}>`)
    } else if (typeof value === 'object') {
      lines.push(`${spaces}<${safeKey}>`)
      lines.push(objectToXml(value, indent + 2))
      lines.push(`${spaces}</${safeKey}>`)
    } else {
      lines.push(`${spaces}<${safeKey}>${escapeXml(String(value))}</${safeKey}>`)
    }
  }

  return lines.join('\n')
}

/**
 * Export dataset items to XML format
 * @param items - Array of dataset items
 * @param datasetName - Optional dataset name for root element
 * @returns XML string with proper escaping
 */
export function exportToXml(
  items: DatasetItem[],
  datasetName = 'dataset'
): string {
  const lines: string[] = []

  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push(`<${datasetName}>`)
  lines.push('  <metadata>')
  lines.push(`    <name>${escapeXml(datasetName)}</name>`)
  lines.push(`    <count>${items.length}</count>`)
  lines.push(`    <exportedAt>${escapeXml(new Date().toISOString())}</exportedAt>`)
  lines.push('  </metadata>')
  lines.push('  <items>')

  items.forEach(item => {
    lines.push('    <item>')
    lines.push(objectToXml(item, 6))
    lines.push('    </item>')
  })

  lines.push('  </items>')
  lines.push(`</${datasetName}>`)

  return lines.join('\n')
}
