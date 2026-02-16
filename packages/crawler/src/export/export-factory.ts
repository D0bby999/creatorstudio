import type { DatasetItem, ExportFormat } from '../types/crawler-types.js'
import { exportToJson } from './json-exporter.js'
import { exportToCsv } from './csv-exporter.js'
import { exportToXml } from './xml-exporter.js'

export interface Exporter {
  export(items: DatasetItem[]): string
  mimeType: string
  extension: string
}

/**
 * Create exporter for specified format
 * @param format - Export format (json, csv, xml)
 * @returns Exporter instance
 * @throws Error if format is not supported
 */
export function createExporter(format: ExportFormat): Exporter {
  switch (format) {
    case 'json':
      return {
        export: (items) => exportToJson(items, { pretty: true }),
        mimeType: 'application/json',
        extension: 'json',
      }

    case 'csv':
      return {
        export: (items) => exportToCsv(items),
        mimeType: 'text/csv',
        extension: 'csv',
      }

    case 'xml':
      return {
        export: (items) => exportToXml(items),
        mimeType: 'application/xml',
        extension: 'xml',
      }

    case 'xlsx':
      throw new Error('XLSX export not yet implemented')

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}
