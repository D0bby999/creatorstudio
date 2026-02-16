import type { DatasetItem } from '../types/crawler-types.js'

/**
 * Export dataset items to JSON format
 * @param items - Array of dataset items
 * @param options - Export options
 * @returns JSON string
 */
export function exportToJson(
  items: DatasetItem[],
  options?: { pretty?: boolean }
): string {
  const exportData = {
    items,
    metadata: {
      count: items.length,
      exportedAt: new Date().toISOString(),
    },
  }

  if (options?.pretty) {
    return JSON.stringify(exportData, null, 2)
  }

  return JSON.stringify(exportData)
}

/**
 * Export raw data array to JSON
 * @param data - Array of any serializable data
 * @param options - Export options
 * @returns JSON string
 */
export function exportRawJson<T>(
  data: T[],
  options?: { pretty?: boolean }
): string {
  if (options?.pretty) {
    return JSON.stringify(data, null, 2)
  }

  return JSON.stringify(data)
}
