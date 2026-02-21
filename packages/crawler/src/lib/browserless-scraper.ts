import puppeteer from 'puppeteer-core'
import type { ScrapedContent } from '../types/crawler-types'
import { resolveAndValidateUrl } from '@creator-studio/utils/ssrf-validator'

import type { FingerprintManager } from '../stealth/fingerprint-manager.js'

interface BrowserlessConfig {
  apiUrl?: string
  apiToken?: string
  timeout?: number
  fingerprintId?: string
  fingerprintManager?: FingerprintManager
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

  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  // Validate URL with DNS resolution — allow HTTP for crawler
  await resolveAndValidateUrl(normalizedUrl, { allowHttp: true })

  // Build WebSocket endpoint with token
  const wsEndpoint = `${apiUrl}?token=${apiToken}`

  let browser
  let page

  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
    })

    page = await browser.newPage()

    // Apply fingerprint if available
    if (config.fingerprintId && config.fingerprintManager) {
      try {
        await config.fingerprintManager.applyToPage(page, config.fingerprintId)
      } catch {
        // Fallback: continue without fingerprint injection
      }
    }

    await page.goto(normalizedUrl, {
      waitUntil: 'networkidle0',
      timeout,
    })

    const content = await page.evaluate(() => {
      const title =
        document.title ||
        document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        document.querySelector('h1')?.textContent?.trim() ||
        'No title'

      const description =
        document.querySelector('meta[name="description"]')?.getAttribute('content') ||
        document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        document.querySelector('p')?.textContent?.trim().slice(0, 200) ||
        ''

      const headings: string[] = []
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
        const text = el.textContent?.trim()
        if (text) headings.push(text)
      })

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

      const clonedDoc = document.body.cloneNode(true) as HTMLElement
      clonedDoc.querySelectorAll('script, style, nav, header, footer').forEach((el) => el.remove())
      const text = clonedDoc.textContent?.trim().replace(/\s+/g, ' ').slice(0, 5000) || ''

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
        images: Array.from(new Set(images)),
        links: Array.from(new Set(links)),
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
    if (page) {
      await page.close().catch(() => {})
    }
    if (browser) {
      await browser.disconnect()
    }
  }
}
