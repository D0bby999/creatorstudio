import * as cheerio from 'cheerio'
import type { ScrapedContent } from '../types/crawler-types'
import { resolveAndValidateUrl } from '@creator-studio/utils/ssrf-validator'
import { HttpClient } from './http-client.js'

const httpClient = new HttpClient()

/**
 * Scrapes a URL and extracts content using cheerio + got-scraping (HTTP/2)
 */
export async function scrapeUrl(
  url: string,
  session?: { cookies?: string; userAgent?: string },
  headers?: Record<string, string>
): Promise<ScrapedContent> {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    await resolveAndValidateUrl(normalizedUrl, { allowHttp: true })

    const requestHeaders: Record<string, string> = {
      ...headers,
      ...(session?.userAgent ? { 'User-Agent': session.userAgent } : {}),
      ...(session?.cookies ? { Cookie: session.cookies } : {}),
    }

    const response = await httpClient.get(normalizedUrl, {
      headers: requestHeaders,
      timeout: 10000,
    })

    if (response.statusCode >= 400) {
      throw new Error(`HTTP ${response.statusCode}`)
    }

    const html = response.body
    const $ = cheerio.load(html)

    const title = $('title').text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('h1').first().text().trim() ||
                  'No title'

    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('p').first().text().trim().slice(0, 200) ||
                       ''

    const headings: string[] = []
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim()
      if (text) headings.push(text)
    })

    const images: string[] = []
    $('img').each((_, el) => {
      const src = $(el).attr('src')
      if (src) {
        try {
          images.push(new URL(src, normalizedUrl).href)
        } catch {
          images.push(src)
        }
      }
    })

    const links: string[] = []
    $('a').each((_, el) => {
      const href = $(el).attr('href')
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          links.push(new URL(href, normalizedUrl).href)
        } catch {
          links.push(href)
        }
      }
    })

    $('script, style, nav, header, footer').remove()
    const text = $('body').text().trim().replace(/\s+/g, ' ').slice(0, 5000)

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
      images: [...new Set(images)],
      links: [...new Set(links)],
      text,
      meta,
      scrapedAt: new Date().toISOString(),
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: URL took too long to respond')
    }
    throw error
  }
}
