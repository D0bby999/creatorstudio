import { describe, it, expect } from 'vitest'
import { analyzeSeo } from '../src/lib/seo-analyzer'
import type { ScrapedContent } from '../src/types/crawler-types'

describe('seo-analyzer', () => {
  const createMockContent = (overrides: Partial<ScrapedContent> = {}): ScrapedContent => ({
    url: 'https://example.com',
    title: 'A proper title that is between thirty and sixty characters',
    description: 'A good meta description that is between one hundred twenty and one hundred sixty characters long for optimal SEO performance',
    headings: ['Main H1 Heading', 'Subheading 2', 'Subheading 3'],
    images: ['https://example.com/img.jpg'],
    links: ['https://example.com/page'],
    text: 'content example website information article search engine optimization quality relevant keywords',
    meta: {
      'og:title': 'Example',
      'og:description': 'Description',
      'og:image': 'https://example.com/og.jpg',
      'og:url': 'https://example.com',
    },
    scrapedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  })

  it('should deduct 20 points for missing title', () => {
    const content = createMockContent({ title: '' })
    const report = analyzeSeo(content)

    expect(report.score).toBeLessThanOrEqual(80)
    expect(report.issues).toContain('Missing page title')
  })

  it('should deduct 15 points for missing description', () => {
    const content = createMockContent({ description: '' })
    const report = analyzeSeo(content)

    expect(report.score).toBeLessThanOrEqual(85)
    expect(report.issues).toContain('Missing meta description')
  })

  it('should deduct 15 points for missing H1', () => {
    const content = createMockContent({ headings: [], text: '' })
    const report = analyzeSeo(content)

    expect(report.score).toBeLessThanOrEqual(85)
    expect(report.issues).toContain('Missing H1 heading')
    expect(report.headings.hasH1).toBe(false)
  })

  it('should never return score below 0', () => {
    const content = createMockContent({
      title: '',
      description: '',
      headings: [],
      text: '',
      meta: {},
    })
    const report = analyzeSeo(content)

    expect(report.score).toBeGreaterThanOrEqual(0)
  })

  it('should never return score above 100', () => {
    const content = createMockContent()
    const report = analyzeSeo(content)

    expect(report.score).toBeLessThanOrEqual(100)
  })

  it('should score high (80+) for good content', () => {
    const content = createMockContent()
    const report = analyzeSeo(content)

    expect(report.score).toBeGreaterThanOrEqual(80)
    expect(report.title.optimal).toBe(true)
    expect(report.description.optimal).toBe(true)
  })

  it('should flag short title', () => {
    const content = createMockContent({ title: 'Too short' })
    const report = analyzeSeo(content)

    expect(report.title.optimal).toBe(false)
    expect(report.issues.some(issue => issue.includes('Title too short'))).toBe(true)
  })

  it('should flag long title', () => {
    const content = createMockContent({
      title: 'This is a very long title that exceeds the optimal sixty character limit',
    })
    const report = analyzeSeo(content)

    expect(report.title.optimal).toBe(false)
    expect(report.issues.some(issue => issue.includes('Title too long'))).toBe(true)
  })

  it('should flag short description', () => {
    const content = createMockContent({ description: 'Too short description' })
    const report = analyzeSeo(content)

    expect(report.description.optimal).toBe(false)
    expect(report.issues.some(issue => issue.includes('Description too short'))).toBe(true)
  })

  it('should extract top keywords from text', () => {
    const content = createMockContent({
      text: 'testing testing testing example example quality quality quality quality',
    })
    const report = analyzeSeo(content)

    expect(report.keywords.length).toBeGreaterThan(0)
    expect(report.keywords[0].word).toBe('quality') // Most frequent
    expect(report.keywords[0].count).toBe(4)
  })

  it('should detect missing Open Graph tags', () => {
    const content = createMockContent({ meta: {} })
    const report = analyzeSeo(content)

    expect(report.issues.some(issue => issue.includes('Missing Open Graph tags'))).toBe(true)
  })

  it('should return correct analyzedAt timestamp', () => {
    const content = createMockContent()
    const report = analyzeSeo(content)

    expect(report.analyzedAt).toBeTruthy()
    expect(new Date(report.analyzedAt).getTime()).toBeGreaterThan(0)
  })
})
