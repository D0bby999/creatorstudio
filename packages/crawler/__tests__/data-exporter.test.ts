import { describe, it, expect } from 'vitest'
import { exportToJson, exportToCsv } from '../src/lib/data-exporter'
import type { ScrapedContent } from '../src/types/crawler-types'

describe('data-exporter', () => {
  const mockData: ScrapedContent[] = [
    {
      url: 'https://example.com',
      title: 'Example Site',
      description: 'A test website',
      headings: ['Main Heading', 'Sub Heading'],
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      links: ['https://example.com/page1', 'https://example.com/page2'],
      text: 'Sample text content',
      meta: { 'og:title': 'Example' },
      scrapedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      url: 'https://test.com',
      title: 'Test Page',
      description: 'Another test',
      headings: ['Header'],
      images: [],
      links: ['https://test.com/link'],
      text: 'More content',
      meta: {},
      scrapedAt: '2024-01-02T00:00:00.000Z',
    },
  ]

  describe('exportToJson', () => {
    it('should export valid JSON with 2-space indentation', () => {
      const json = exportToJson(mockData)
      const parsed = JSON.parse(json)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].url).toBe('https://example.com')
      expect(json).toContain('  ') // Has indentation
    })

    it('should preserve all fields in JSON export', () => {
      const json = exportToJson(mockData)
      const parsed = JSON.parse(json)

      expect(parsed[0]).toHaveProperty('url')
      expect(parsed[0]).toHaveProperty('title')
      expect(parsed[0]).toHaveProperty('description')
      expect(parsed[0]).toHaveProperty('headings')
      expect(parsed[0]).toHaveProperty('images')
      expect(parsed[0]).toHaveProperty('links')
      expect(parsed[0]).toHaveProperty('text')
      expect(parsed[0]).toHaveProperty('meta')
      expect(parsed[0]).toHaveProperty('scrapedAt')
    })
  })

  describe('exportToCsv', () => {
    it('should have correct headers in first row', () => {
      const csv = exportToCsv(mockData)
      const lines = csv.split('\n')

      expect(lines[0]).toBe('url,title,description,headingsCount,imagesCount,linksCount,scrapedAt')
    })

    it('should have correct number of rows and columns', () => {
      const csv = exportToCsv(mockData)
      const lines = csv.split('\n')

      expect(lines).toHaveLength(3) // Header + 2 data rows

      const columns = lines[0].split(',')
      expect(columns).toHaveLength(7)
    })

    it('should escape commas in fields correctly', () => {
      const dataWithCommas: ScrapedContent[] = [{
        url: 'https://example.com',
        title: 'Title with, comma',
        description: 'Normal description',
        headings: [],
        images: [],
        links: [],
        text: '',
        meta: {},
        scrapedAt: '2024-01-01T00:00:00.000Z',
      }]

      const csv = exportToCsv(dataWithCommas)
      const lines = csv.split('\n')

      expect(lines[1]).toContain('"Title with, comma"')
    })

    it('should escape quotes in fields correctly', () => {
      const dataWithQuotes: ScrapedContent[] = [{
        url: 'https://example.com',
        title: 'Normal title',
        description: 'Description with "quotes" inside',
        headings: [],
        images: [],
        links: [],
        text: '',
        meta: {},
        scrapedAt: '2024-01-01T00:00:00.000Z',
      }]

      const csv = exportToCsv(dataWithQuotes)
      const lines = csv.split('\n')

      expect(lines[1]).toContain('""quotes""') // Double-escaped quotes
    })

    it('should handle newlines in fields', () => {
      const dataWithNewlines: ScrapedContent[] = [{
        url: 'https://example.com',
        title: 'Multi\nline\ntitle',
        description: 'Normal',
        headings: [],
        images: [],
        links: [],
        text: '',
        meta: {},
        scrapedAt: '2024-01-01T00:00:00.000Z',
      }]

      const csv = exportToCsv(dataWithNewlines)

      // CSV output should wrap field with newlines in quotes
      expect(csv).toContain('"Multi\nline\ntitle"')
    })

    it('should correctly count arrays in CSV', () => {
      const csv = exportToCsv(mockData)
      const lines = csv.split('\n')
      const firstDataRow = lines[1].split(',')

      expect(firstDataRow[3]).toBe('2') // headingsCount
      expect(firstDataRow[4]).toBe('2') // imagesCount
      expect(firstDataRow[5]).toBe('2') // linksCount
    })
  })
})
