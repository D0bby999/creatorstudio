import { scrapeUrl } from './url-scraper'
import { scrapeWithBrowser } from './browserless-scraper'
import type { ScrapedContent } from '../types/crawler-types'

export interface SmartScrapedContent extends ScrapedContent {
  scrapedWith: 'cheerio' | 'browserless'
}

/**
 * Backward-compatible smart scraper function.
 * For multi-page crawls, use SmartCrawler from '../engine/smart-crawler' instead.
 */
export async function smartScrape(
  url: string,
  html?: string
): Promise<SmartScrapedContent> {
  // Step 1: Try cheerio first (fast, serverless-friendly)
  const cheerioContent = await scrapeUrl(url)

  // Step 2: Check if content looks JS-rendered
  if (!isJsRendered(cheerioContent, html)) {
    return { ...cheerioContent, scrapedWith: 'cheerio' }
  }

  // Step 3: Fall back to Browserless if available
  if (!process.env.BROWSERLESS_API_URL || !process.env.BROWSERLESS_API_TOKEN) {
    console.warn(`[smart-scraper] JS-rendered but Browserless not configured: ${url}`)
    return { ...cheerioContent, scrapedWith: 'cheerio' }
  }

  const browserContent = await scrapeWithBrowser(url)
  return { ...browserContent, scrapedWith: 'browserless' }
}

function isJsRendered(content: ScrapedContent, html?: string): boolean {
  if (content.text.length < 100) return true

  if (html) {
    const indicators = ['<div id="root"', '<div id="app"', '<div id="__next"', 'react', 'vue.js', 'angular']
    const lower = html.toLowerCase()
    if (indicators.some((i) => lower.includes(i)) && content.text.length < 500) return true
  }

  return false
}
