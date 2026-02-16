/**
 * Link extraction and discovery from HTML content
 */

import * as cheerio from 'cheerio'
import type { DiscoveredLink } from '../types/crawler-types.js'
import { normalizeUrl } from './url-normalizer.js'

export interface LinkFollowerConfig {
  sameDomainOnly?: boolean
  normalizeUrls?: boolean
}

/**
 * Extract all links from HTML content
 */
export function extractLinks(
  html: string,
  baseUrl: string,
  config: LinkFollowerConfig = {}
): DiscoveredLink[] {
  const { sameDomainOnly = false, normalizeUrls = true } = config
  const links: DiscoveredLink[] = []
  const baseDomain = sameDomainOnly ? new URL(baseUrl).hostname : null

  try {
    const $ = cheerio.load(html)

    // Extract from <a> tags
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href')
      if (!href) return

      const resolved = resolveUrl(href, baseUrl)
      if (!resolved || !isValidHttpUrl(resolved)) return
      if (sameDomainOnly && !isSameDomain(resolved, baseDomain!)) return

      const link: DiscoveredLink = {
        url: normalizeUrls ? normalizeUrl(resolved) : resolved,
        text: $(elem).text().trim(),
        rel: $(elem).attr('rel'),
        tag: 'a',
      }
      links.push(link)
    })

    // Extract from <link> tags (alternate, canonical, etc.)
    $('link[href]').each((_, elem) => {
      const href = $(elem).attr('href')
      if (!href) return

      const resolved = resolveUrl(href, baseUrl)
      if (!resolved || !isValidHttpUrl(resolved)) return
      if (sameDomainOnly && !isSameDomain(resolved, baseDomain!)) return

      const link: DiscoveredLink = {
        url: normalizeUrls ? normalizeUrl(resolved) : resolved,
        text: '',
        rel: $(elem).attr('rel'),
        tag: 'link',
      }
      links.push(link)
    })

    // Extract from <area> tags (image maps)
    $('area[href]').each((_, elem) => {
      const href = $(elem).attr('href')
      if (!href) return

      const resolved = resolveUrl(href, baseUrl)
      if (!resolved || !isValidHttpUrl(resolved)) return
      if (sameDomainOnly && !isSameDomain(resolved, baseDomain!)) return

      const link: DiscoveredLink = {
        url: normalizeUrls ? normalizeUrl(resolved) : resolved,
        text: $(elem).attr('alt') || '',
        rel: undefined,
        tag: 'area',
      }
      links.push(link)
    })
  } catch (error) {
    console.warn('Failed to extract links:', error)
    return []
  }

  return links
}

/**
 * Resolve relative URL against base URL
 */
function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return null
  }
}

/**
 * Check if URL is valid HTTP(S) URL
 */
function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Check if URL belongs to the same domain
 */
function isSameDomain(url: string, baseDomain: string): boolean {
  try {
    return new URL(url).hostname === baseDomain
  } catch {
    return false
  }
}
