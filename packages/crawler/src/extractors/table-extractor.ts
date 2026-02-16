import * as cheerio from 'cheerio'
import type { TableData } from '../types/crawler-types'

/**
 * Extracts structured data from HTML tables
 * @param html - HTML string to parse
 * @returns Array of table data objects
 */
export function extractTables(html: string): TableData[] {
  const $ = cheerio.load(html)
  const tables: TableData[] = []

  $('table').each((_, tableElement) => {
    const $table = $(tableElement)
    const tableData = parseTable($, $table)

    // Only include tables with headers and data
    if (tableData.headers.length > 0 && tableData.rows.length > 0) {
      tables.push(tableData)
    }
  })

  return tables
}

/**
 * Parse a single table element into structured data
 */
function parseTable($: cheerio.CheerioAPI, $table: cheerio.Cheerio<any>): TableData {
  const headers: string[] = []
  const rows: string[][] = []

  // Extract headers from thead or first tr
  const $thead = $table.find('thead')
  if ($thead.length > 0) {
    $thead.find('tr').first().find('th, td').each((_, cell) => {
      headers.push($(cell).text().trim())
    })
  } else {
    // Try to find headers in the first row
    const $firstRow = $table.find('tr').first()
    const $headerCells = $firstRow.find('th')

    if ($headerCells.length > 0) {
      $headerCells.each((_, cell) => {
        headers.push($(cell).text().trim())
      })
    } else {
      // Use first row as headers if no <th> found
      $firstRow.find('td').each((_, cell) => {
        headers.push($(cell).text().trim())
      })
    }
  }

  // Extract data rows from tbody or all rows
  const $tbody = $table.find('tbody')
  const $dataRows = $tbody.length > 0 ? $tbody.find('tr') : $table.find('tr').slice(1)

  $dataRows.each((_, rowElement) => {
    const row: string[] = []
    const $cells = $(rowElement).find('td, th')

    $cells.each((colIndex, cell) => {
      const $cell = $(cell)
      const text = $cell.text().trim()

      // Handle colspan
      const colspan = parseInt($cell.attr('colspan') || '1', 10)
      for (let i = 0; i < colspan; i++) {
        row.push(i === 0 ? text : '')
      }
    })

    // Handle rowspan by storing cells for future rows
    // (simplified - just add the row as-is)
    if (row.length > 0) {
      rows.push(row)
    }
  })

  return { headers, rows }
}
