import { scrapeUrl } from './url-scraper'
import { scrapeWithBrowser } from './browserless-scraper'
import type { ScrapedContent } from '../types/crawler-types'

interface SmartScrapedContent extends ScrapedContent {
  scrapedWith: 'cheerio' | 'browserless'
}

/**
 * Detects if content appears to be JavaScript-rendered based on heuristics
 */
function isJsRendered(content: ScrapedContent, html?: string): boolean {
  // Check 1: Very short body text with noscript tag
  if (content.text.length < 100 && html?.includes('<noscript>')) {
    return true
  }

  // Check 2: Body text is too short (likely placeholder or empty)
  if (content.text.length < 100) {
    return true
  }

  // Check 3: Common SPA framework indicators in HTML
  if (html) {
    const spaIndicators = [
      '<div id="root"',
      '<div id="app"',
      '<div id="__next"',
      'react',
      'vue.js',
      'angular',
      'ember.js',
    ]

    const lowerHtml = html.toLowerCase()
    const hasFramework = spaIndicators.some((indicator) => lowerHtml.includes(indicator))

    // If framework detected AND minimal content, likely JS-rendered
    if (hasFramework && content.text.length < 500) {
      return true
    }
  }

  return false
}

/**
 * Smart scraper that tries cheerio first, falls back to Browserless for JS-rendered sites
 * @param url - URL to scrape
 * @param html - Optional HTML string for JS detection (from cheerio fetch)
 */
export async function smartScrape(
  url: string,
  html?: string
): Promise<SmartScrapedContent> {
  try {
    // Step 1: Try cheerio first (fast, free, serverless-friendly)
    const cheerioContent = await scrapeUrl(url)

    // Step 2: Check if content looks JS-rendered
    const needsBrowser = isJsRendered(cheerioContent, html)

    if (!needsBrowser) {
      // Content looks good, use cheerio result
      return {
        ...cheerioContent,
        scrapedWith: 'cheerio',
      }
    }

    // Step 3: Fall back to Browserless for JS-rendered content
    const browserlessUrl = process.env.BROWSERLESS_API_URL
    const browserlessToken = process.env.BROWSERLESS_API_TOKEN

    if (!browserlessUrl || !browserlessToken) {
      // Browserless not configured, return cheerio result with warning
      console.warn(
        `[smart-scraper] URL appears JS-rendered but Browserless not configured: ${url}`
      )
      return {
        ...cheerioContent,
        scrapedWith: 'cheerio',
      }
    }

    // Scrape with Browserless
    const browserContent = await scrapeWithBrowser(url)

    return {
      ...browserContent,
      scrapedWith: 'browserless',
    }
  } catch (error) {
    // On any error, try to fall back to cheerio if we haven't already
    throw error
  }
}
