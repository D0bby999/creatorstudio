import type { CrawlRequest, CrawlerEngineConfig } from '../types/crawler-types.js'

/**
 * Filters discovered links based on depth and domain constraints
 */
export function filterDiscoveredLinks(
  links: string[],
  parentRequest: CrawlRequest,
  config: CrawlerEngineConfig
): string[] {
  const parentDepth = parentRequest.depth ?? 0
  const nextDepth = parentDepth + 1

  if (nextDepth > config.maxDepth) return []

  return links.filter((link) => {
    try {
      const linkUrl = new URL(link)
      const parentUrl = new URL(parentRequest.url)

      if (config.sameDomainOnly) {
        return linkUrl.hostname === parentUrl.hostname
      }
      return true
    } catch {
      return false
    }
  })
}
