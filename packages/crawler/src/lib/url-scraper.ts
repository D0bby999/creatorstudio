import * as cheerio from 'cheerio'
import type { ScrapedContent } from '../types/crawler-types'

/**
 * Scrapes a URL and extracts content using cheerio
 * @param url - URL to scrape
 * @param session - Optional session data (cookies, userAgent)
 */
export async function scrapeUrl(
  url: string,
  session?: { cookies?: string; userAgent?: string }
): Promise<ScrapedContent> {
  try {
    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

    // Fetch HTML with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': session?.userAgent ?? 'Mozilla/5.0 (compatible; CreatorStudio/1.0; +https://creatorstudio.dev)',
        ...(session?.cookies ? { 'Cookie': session.cookies } : {}),
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract title
    const title = $('title').text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('h1').first().text().trim() ||
                  'No title'

    // Extract description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('p').first().text().trim().slice(0, 200) ||
                       ''

    // Extract headings
    const headings: string[] = []
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim()
      if (text) headings.push(text)
    })

    // Extract images
    const images: string[] = []
    $('img').each((_, el) => {
      const src = $(el).attr('src')
      if (src) {
        // Convert relative URLs to absolute
        try {
          const imgUrl = new URL(src, normalizedUrl).href
          images.push(imgUrl)
        } catch {
          images.push(src)
        }
      }
    })

    // Extract links
    const links: string[] = []
    $('a').each((_, el) => {
      const href = $(el).attr('href')
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const linkUrl = new URL(href, normalizedUrl).href
          links.push(linkUrl)
        } catch {
          links.push(href)
        }
      }
    })

    // Extract text content (body text only, remove script/style)
    $('script, style, nav, header, footer').remove()
    const text = $('body').text().trim().replace(/\s+/g, ' ').slice(0, 5000)

    // Extract meta tags
    const meta: Record<string, string> = {}
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property')
      const content = $(el).attr('content')
      if (name && content) {
        meta[name] = content
      }
    })

    return {
      url: normalizedUrl,
      title,
      description,
      headings,
      images: [...new Set(images)], // dedupe
      links: [...new Set(links)], // dedupe
      text,
      meta,
      scrapedAt: new Date().toISOString()
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: URL took too long to respond')
    }
    throw error
  }
}
