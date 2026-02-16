/**
 * URL pattern filtering with glob-like matching and preset filters
 */

import type { UrlFilterConfig } from '../types/crawler-types.js'

const ASSET_EXTENSIONS = [
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.mp4',
  '.mp3',
  '.avi',
  '.mov',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]

export class UrlPatternFilter {
  private includePatterns: RegExp[]
  private excludePatterns: RegExp[]
  private skipAssets: boolean

  constructor(config: UrlFilterConfig = {}) {
    this.includePatterns = (config.include || []).map(globToRegex)
    this.excludePatterns = (config.exclude || []).map(globToRegex)
    this.skipAssets = config.skipAssets ?? false
  }

  /**
   * Check if URL should be crawled based on configured patterns
   */
  shouldCrawl(url: string): boolean {
    try {
      const parsed = new URL(url)
      const pathname = parsed.pathname.toLowerCase()

      // Skip assets if configured
      if (this.skipAssets && this.isAsset(pathname)) {
        return false
      }

      // Check exclude patterns first (blacklist)
      if (this.excludePatterns.length > 0) {
        for (const pattern of this.excludePatterns) {
          if (pattern.test(url)) {
            return false
          }
        }
      }

      // Check include patterns (whitelist)
      if (this.includePatterns.length > 0) {
        for (const pattern of this.includePatterns) {
          if (pattern.test(url)) {
            return true
          }
        }
        return false // Has whitelist but URL didn't match
      }

      return true // No patterns or passed all checks
    } catch {
      return false // Invalid URL
    }
  }

  /**
   * Check if pathname points to an asset file
   */
  private isAsset(pathname: string): boolean {
    return ASSET_EXTENSIONS.some(ext => pathname.endsWith(ext))
  }
}

/**
 * Convert glob-like pattern to RegExp
 * Supports: * (any chars including /), ** (same as *), ? (single char)
 */
function globToRegex(pattern: string): RegExp {
  let regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*')                  // * matches any chars (including /)
    .replace(/\?/g, '.')                   // ? matches single char

  return new RegExp(`^${regex}$`, 'i')
}
