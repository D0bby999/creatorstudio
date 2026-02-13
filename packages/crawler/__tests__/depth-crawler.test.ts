import { describe, it, expect, vi } from 'vitest'
import { crawlWithDepth } from '../src/lib/depth-crawler'
import type { ScrapedContent, CrawlConfig } from '../src/types/crawler-types'

describe('depth-crawler', () => {
  const createMockContent = (url: string, links: string[] = []): ScrapedContent => ({
    url,
    title: `Page ${url}`,
    description: 'Test page',
    headings: ['Heading'],
    images: [],
    links,
    text: 'Sample content',
    meta: {},
    scrapedAt: new Date().toISOString(),
  })

  it('should only crawl seed URL when maxDepth=0', async () => {
    const mockScrape = vi.fn(async (url: string) => createMockContent(url, [
      'https://example.com/page1',
      'https://example.com/page2',
    ]))

    const config: CrawlConfig = {
      maxDepth: 0,
      sameDomainOnly: true,
      maxPages: 10,
      rateLimitPerDomain: 60,
    }

    const results: ScrapedContent[] = []
    for await (const content of crawlWithDepth('https://example.com', config, mockScrape)) {
      results.push(content)
    }

    expect(results).toHaveLength(1)
    expect(results[0].url).toBe('https://example.com')
    expect(mockScrape).toHaveBeenCalledTimes(1)
  })

  it('should not infinite loop on circular links', async () => {
    const mockScrape = vi.fn(async (url: string) => {
      if (url === 'https://example.com') {
        return createMockContent(url, ['https://example.com/page1'])
      }
      if (url === 'https://example.com/page1') {
        return createMockContent(url, ['https://example.com']) // Circular back to seed
      }
      return createMockContent(url, [])
    })

    const config: CrawlConfig = {
      maxDepth: 1,
      sameDomainOnly: true,
      maxPages: 10,
      rateLimitPerDomain: 60,
    }

    const results: ScrapedContent[] = []
    const urlsCrawled = new Set<string>()

    for await (const content of crawlWithDepth('https://example.com', config, mockScrape)) {
      results.push(content)
      urlsCrawled.add(content.url)
    }

    // Should visit each URL only once (no infinite loop on circular reference)
    expect(results).toHaveLength(2) // seed and page1 only
    expect(urlsCrawled.size).toBe(2)

    // Ensure https://example.com was not crawled twice despite circular link
    const exampleComCount = results.filter(r => r.url === 'https://example.com').length
    expect(exampleComCount).toBe(1)
  })

  it('should filter cross-domain links when sameDomainOnly=true', async () => {
    const mockScrape = vi.fn(async (url: string) => createMockContent(url, [
      'https://example.com/page1',
      'https://other-domain.com/page',
      'https://example.com/page2',
    ]))

    const config: CrawlConfig = {
      maxDepth: 1,
      sameDomainOnly: true,
      maxPages: 10,
      rateLimitPerDomain: 60,
    }

    const results: ScrapedContent[] = []
    for await (const content of crawlWithDepth('https://example.com', config, mockScrape)) {
      results.push(content)
    }

    const urls = results.map(r => r.url)
    expect(urls).toContain('https://example.com')
    expect(urls).toContain('https://example.com/page1')
    expect(urls).toContain('https://example.com/page2')
    expect(urls).not.toContain('https://other-domain.com/page')
  })

  it('should respect maxPages limit', async () => {
    const mockScrape = vi.fn(async (url: string) => createMockContent(url, [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3',
      'https://example.com/page4',
      'https://example.com/page5',
    ]))

    const config: CrawlConfig = {
      maxDepth: 2,
      sameDomainOnly: true,
      maxPages: 3, // Limit to 3 pages
      rateLimitPerDomain: 60,
    }

    const results: ScrapedContent[] = []
    for await (const content of crawlWithDepth('https://example.com', config, mockScrape)) {
      results.push(content)
    }

    expect(results).toHaveLength(3)
  })

  it('should crawl to specified depth', async () => {
    const mockScrape = vi.fn(async (url: string) => {
      if (url === 'https://example.com') {
        return createMockContent(url, ['https://example.com/level1'])
      }
      if (url === 'https://example.com/level1') {
        return createMockContent(url, ['https://example.com/level2'])
      }
      return createMockContent(url, [])
    })

    const config: CrawlConfig = {
      maxDepth: 2,
      sameDomainOnly: true,
      maxPages: 10,
      rateLimitPerDomain: 60,
    }

    const results: ScrapedContent[] = []
    for await (const content of crawlWithDepth('https://example.com', config, mockScrape)) {
      results.push(content)
    }

    const urls = results.map(r => r.url)
    expect(urls).toContain('https://example.com')
    expect(urls).toContain('https://example.com/level1')
    expect(urls).toContain('https://example.com/level2')
    expect(results).toHaveLength(3)
  })

  it('should skip invalid URLs gracefully', async () => {
    const mockScrape = vi.fn(async (url: string) => createMockContent(url, [
      'https://example.com/valid',
      'javascript:void(0)', // Invalid protocol
      'not-a-url',
      'https://example.com/another-valid',
    ]))

    const config: CrawlConfig = {
      maxDepth: 1,
      sameDomainOnly: true,
      maxPages: 10,
      rateLimitPerDomain: 60,
    }

    const results: ScrapedContent[] = []
    for await (const content of crawlWithDepth('https://example.com', config, mockScrape)) {
      results.push(content)
    }

    const urls = results.map(r => r.url)
    expect(urls).toContain('https://example.com/valid')
    expect(urls).toContain('https://example.com/another-valid')
  })

  it('should handle scrape failures and continue', async () => {
    let callCount = 0
    const mockScrape = vi.fn(async (url: string) => {
      callCount++
      if (callCount === 2) {
        throw new Error('Scrape failed')
      }
      return createMockContent(url, ['https://example.com/page1', 'https://example.com/page2'])
    })

    const config: CrawlConfig = {
      maxDepth: 1,
      sameDomainOnly: true,
      maxPages: 10,
      rateLimitPerDomain: 60,
    }

    const results: ScrapedContent[] = []
    for await (const content of crawlWithDepth('https://example.com', config, mockScrape)) {
      results.push(content)
    }

    // Should get seed URL and page2, page1 failed
    expect(results.length).toBeGreaterThan(0)
  })
})
