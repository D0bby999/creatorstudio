import type { DatasetItem, CsvColumn } from '../types/crawler-types.js'

/**
 * Escape CSV field value (handle commas, quotes, newlines)
 */
function escapeField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

/**
 * Get nested value from object using dot notation
 * @example getNestedValue({ meta: { title: 'Test' } }, 'meta.title') => 'Test'
 */
function getNestedValue(obj: any, path: string): string {
  const value = path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return ''
    return current[key]
  }, obj)

  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.join('; ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Auto-detect columns from first item
 */
function autoDetectColumns(item: DatasetItem): CsvColumn[] {
  const columns: CsvColumn[] = [
    { key: 'url', header: 'URL' },
    { key: 'data.title', header: 'Title' },
    { key: 'data.description', header: 'Description' },
    { key: 'data.text', header: 'Text' },
    { key: 'contentHash', header: 'Content Hash' },
    { key: 'createdAt', header: 'Created At' },
  ]

  // Add meta fields if present
  if (item.data.meta && Object.keys(item.data.meta).length > 0) {
    Object.keys(item.data.meta).forEach(key => {
      columns.push({ key: `data.meta.${key}`, header: `Meta: ${key}` })
    })
  }

  return columns
}

/**
 * Export dataset items to CSV format
 * @param items - Array of dataset items
 * @param columns - Optional column configuration
 * @returns CSV string with headers and escaped fields
 */
export function exportToCsv(
  items: DatasetItem[],
  columns?: CsvColumn[]
): string {
  if (items.length === 0) {
    return ''
  }

  const cols = columns || autoDetectColumns(items[0])
  const headers = cols.map(col => escapeField(col.header))

  const rows = items.map(item => {
    return cols.map(col => {
      const value = getNestedValue(item, col.key)
      return escapeField(value)
    }).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}
