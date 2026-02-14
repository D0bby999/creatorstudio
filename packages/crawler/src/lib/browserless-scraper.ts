import puppeteer from 'puppeteer-core'
import type { ScrapedContent } from '../types/crawler-types'

interface BrowserlessConfig {
  apiUrl?: string
  apiToken?: string
  timeout?: number
}

/**
 * Inline SSRF prevention for scraping URL validation
 * Blocks private IP ranges to prevent internal network access
 */
function isPrivateHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '::1') {
    return true
  }

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number)
    if (a > 255 || b > 255 || c > 255 || d > 255) return false
    if (a === 10) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
  }

  if (hostname.includes(':')) {
    const lower = hostname.toLowerCase()
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true
    if (lower.startsWith('fe80:')) return true
    if (lower === '::1') return true
  }

  return false
}

function validateScrapeUrl(urlStr: string): void {
  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error(`Invalid URL scheme: ${urlStr}`)
    }
    if (isPrivateHostname(url.hostname)) {
      throw new Error(`Private IP blocked (SSRF prevention): ${urlStr}`)
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL format: ${urlStr}`)
    }
    throw error
  }
}

/**
 * Scrapes a URL using Browserless.io headless Chrome via puppeteer-core
 * @param url - URL to scrape
 * @param config - Browserless configuration
 */
export async function scrapeWithBrowser(
  url: string,
  config: BrowserlessConfig = {}
): Promise<ScrapedContent> {
  const apiUrl = config.apiUrl ?? process.env.BROWSERLESS_API_URL
  const apiToken = config.apiToken ?? process.env.BROWSERLESS_API_TOKEN
  const timeout = config.timeout ?? 30000

  if (!apiUrl || !apiToken) {
    throw new Error('Browserless credentials not configured (BROWSERLESS_API_URL and BROWSERLESS_API_TOKEN required)')
  }

  // Validate URL to prevent SSRF attacks
  validateScrapeUrl(url)

  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  // Build WebSocket endpoint with token
  const wsEndpoint = `${apiUrl}?token=${apiToken}`

  let browser
  let page

  try {
    // Connect to Browserless Chrome instance
    browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
    })

    page = await browser.newPage()

    // Set timeout and wait for page load
    await page.goto(normalizedUrl, {
      waitUntil: 'networkidle0',
      timeout,
    })

    // Extract content using page.evaluate
    const content = await page.evaluate(() => {
      // Extract title
      const title =
        document.title ||
        document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        document.querySelector('h1')?.textContent?.trim() ||
        'No title'

      // Extract description
      const description =
        document.querySelector('meta[name="description"]')?.getAttribute('content') ||
        document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        document.querySelector('p')?.textContent?.trim().slice(0, 200) ||
        ''

      // Extract headings
      const headings: string[] = []
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
        const text = el.textContent?.trim()
        if (text) headings.push(text)
      })

      // Extract images
      const images: string[] = []
      document.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src')
        if (src) {
          try {
            const imgUrl = new URL(src, window.location.href).href
            images.push(imgUrl)
          } catch {
            images.push(src)
          }
        }
      })

      // Extract links
      const links: string[] = []
      document.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href')
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          try {
            const linkUrl = new URL(href, window.location.href).href
            links.push(linkUrl)
          } catch {
            links.push(href)
          }
        }
      })

      // Extract text content (remove script/style)
      const clonedDoc = document.body.cloneNode(true) as HTMLElement
      clonedDoc.querySelectorAll('script, style, nav, header, footer').forEach((el) => el.remove())
      const text = clonedDoc.textContent?.trim().replace(/\s+/g, ' ').slice(0, 5000) || ''

      // Extract meta tags
      const meta: Record<string, string> = {}
      document.querySelectorAll('meta').forEach((metaEl) => {
        const name = metaEl.getAttribute('name') || metaEl.getAttribute('property')
        const content = metaEl.getAttribute('content')
        if (name && content) {
          meta[name] = content
        }
      })

      return {
        title,
        description,
        headings,
        images: Array.from(new Set(images)), // dedupe
        links: Array.from(new Set(links)), // dedupe
        text,
        meta,
      }
    })

    return {
      url: normalizedUrl,
      ...content,
      scrapedAt: new Date().toISOString(),
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(`Browserless timeout: Page took longer than ${timeout}ms to load`)
    }
    throw error
  } finally {
    // Always close page and disconnect browser
    if (page) {
      await page.close().catch(() => {})
    }
    if (browser) {
      await browser.disconnect()
    }
  }
}
