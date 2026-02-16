/**
 * URL Discovery & Sitemap utilities
 *
 * This module provides comprehensive URL discovery capabilities:
 * - Sitemap parsing (XML format, including sitemap index files)
 * - robots.txt parsing (rules, crawl-delay, sitemap discovery)
 * - URL normalization for consistent handling
 * - Pattern-based URL filtering with glob support
 * - Link extraction from HTML content
 * - Auto-discovery of sitemaps via robots.txt and standard paths
 */

export { parseSitemap, isSitemapIndex, extractSitemapUrls } from './sitemap-parser.js'
export { parseRobotsTxt, isAllowed } from './robots-txt-parser.js'
export { normalizeUrl } from './url-normalizer.js'
export type { NormalizeOptions } from './url-normalizer.js'
export { UrlPatternFilter } from './url-pattern-filter.js'
export { extractLinks } from './link-follower.js'
export type { LinkFollowerConfig } from './link-follower.js'
export { fetchSitemapUrls } from './sitemap-fetcher.js'
export type { SitemapFetcherConfig } from './sitemap-fetcher.js'
