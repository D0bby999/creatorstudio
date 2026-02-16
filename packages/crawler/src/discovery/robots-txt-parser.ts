/**
 * robots.txt parser with support for crawl delay and sitemap extraction
 */

import type { RobotsTxtRules } from '../types/crawler-types.js'

/**
 * Parse robots.txt content and extract rules
 */
export function parseRobotsTxt(content: string): RobotsTxtRules {
  const rules: RobotsTxtRules['rules'] = []
  const sitemaps: string[] = []

  const lines = content.split('\n')
  let currentUserAgent: string | null = null
  let currentAllow: string[] = []
  let currentDisallow: string[] = []
  let currentCrawlDelay: number | undefined = undefined

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue

    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const directive = trimmed.slice(0, colonIndex).trim().toLowerCase()
    const value = trimmed.slice(colonIndex + 1).trim()

    switch (directive) {
      case 'user-agent':
        // Save previous user-agent block
        if (currentUserAgent) {
          rules.push({
            userAgent: currentUserAgent,
            allow: currentAllow,
            disallow: currentDisallow,
            crawlDelay: currentCrawlDelay,
          })
        }
        // Start new block
        currentUserAgent = value
        currentAllow = []
        currentDisallow = []
        currentCrawlDelay = undefined
        break

      case 'allow':
        if (currentUserAgent && value) {
          currentAllow.push(value)
        }
        break

      case 'disallow':
        if (currentUserAgent && value) {
          currentDisallow.push(value)
        }
        break

      case 'crawl-delay':
        if (currentUserAgent) {
          const delay = parseFloat(value)
          if (!isNaN(delay) && delay >= 0) {
            currentCrawlDelay = delay
          }
        }
        break

      case 'sitemap':
        if (value) {
          sitemaps.push(value)
        }
        break
    }
  }

  // Save last user-agent block
  if (currentUserAgent) {
    rules.push({
      userAgent: currentUserAgent,
      allow: currentAllow,
      disallow: currentDisallow,
      crawlDelay: currentCrawlDelay,
    })
  }

  return { rules, sitemaps }
}

/**
 * Check if a URL is allowed by robots.txt rules
 */
export function isAllowed(
  url: string,
  robotsTxt: RobotsTxtRules,
  userAgent = '*'
): boolean {
  const path = new URL(url).pathname

  // Find matching rules (prefer specific user-agent, fallback to *)
  const matchingRules = robotsTxt.rules.filter(
    r => r.userAgent === userAgent || r.userAgent === '*'
  )

  if (matchingRules.length === 0) {
    return true // No rules = allowed
  }

  for (const rule of matchingRules) {
    // Check Allow rules first (they take precedence)
    for (const allowPattern of rule.allow) {
      if (matchesPattern(path, allowPattern)) {
        return true
      }
    }

    // Check Disallow rules
    for (const disallowPattern of rule.disallow) {
      if (matchesPattern(path, disallowPattern)) {
        return false
      }
    }
  }

  return true // No matching rules = allowed
}

/**
 * Match path against robots.txt pattern (supports * wildcard)
 */
function matchesPattern(path: string, pattern: string): boolean {
  if (pattern === '') return true // Empty disallow = allow all
  if (pattern === '/') return true // Root pattern matches everything

  // Convert robots.txt pattern to regex
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*') // * becomes .*

  const regex = new RegExp(`^${regexPattern}`)
  return regex.test(path)
}
