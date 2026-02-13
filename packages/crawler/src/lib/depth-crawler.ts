import type { ScrapedContent, CrawlConfig } from '../types/crawler-types'
import { RequestQueue } from './request-queue'
import { DomainRateLimiter } from './rate-limiter'
import { withRetry } from './retry-handler'
import { scrapeUrl } from './url-scraper'

/**
 * Crawl URLs with depth control, rate limiting, and retry logic
 * @param seedUrl - Starting URL for crawl
 * @param config - Crawl configuration (maxDepth, sameDomainOnly, maxPages, rateLimitPerDomain)
 * @param scrapeFn - Function to scrape URL (default: scrapeUrl, injectable for testing)
 * @yields ScrapedContent for each successfully crawled page
 */
export async function* crawlWithDepth(
  seedUrl: string,
  config: CrawlConfig,
  scrapeFn: (url: string) => Promise<ScrapedContent> = scrapeUrl
): AsyncGenerator<ScrapedContent> {
  const visited = new Set<string>()
  const queue = new RequestQueue()
  const rateLimiter = new DomainRateLimiter({
    maxPerMinute: config.rateLimitPerDomain,
    maxConcurrent: 1,
  })
  let pagesCrawled = 0

  // Enqueue seed URL with max priority
  queue.enqueue({
    url: seedUrl,
    priority: config.maxDepth,
    retryCount: 0,
    maxRetries: 3,
    metadata: { depth: 0 },
  })

  while (!queue.isEmpty() && pagesCrawled < config.maxPages) {
    const item = queue.dequeue()
    if (!item || visited.has(item.url)) continue

    visited.add(item.url)

    const domain = new URL(item.url).hostname
    await rateLimiter.waitForSlot(domain)
    rateLimiter.recordRequest(domain)

    try {
      const content = await withRetry(() => scrapeFn(item.url), item.maxRetries)
      pagesCrawled++
      queue.markCompleted(item.url)
      yield content

      // Enqueue discovered links if not at max depth
      const currentDepth = (item.metadata?.depth as number) ?? 0
      if (currentDepth < config.maxDepth) {
        const seedDomain = new URL(seedUrl).hostname

        for (const link of content.links) {
          try {
            const linkUrl = new URL(link)

            // Skip if already visited
            if (visited.has(linkUrl.href)) continue

            // Filter by domain if sameDomainOnly enabled
            if (config.sameDomainOnly && linkUrl.hostname !== seedDomain) continue

            // Only HTTP/HTTPS protocols
            if (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') continue

            queue.enqueue({
              url: linkUrl.href,
              priority: config.maxDepth - currentDepth - 1,
              retryCount: 0,
              maxRetries: 3,
              metadata: { depth: currentDepth + 1 },
            })
          } catch {
            // Invalid URL, skip
          }
        }
      }
    } catch (error) {
      queue.markFailed(item.url, error instanceof Error ? error.message : 'Unknown error')
    }
  }
}
