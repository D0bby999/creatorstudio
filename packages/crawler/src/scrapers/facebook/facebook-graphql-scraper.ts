import { DomainRateLimiter } from '../../lib/rate-limiter.js'
import { withRetry } from '../../lib/retry-handler.js'
import { getStealthHeaders } from '../../stealth/stealth-headers.js'
import { UserAgentPool } from '../../stealth/user-agent-pool.js'
import type {
  FacebookCookies,
  FacebookGraphQLTokens,
  FacebookPost,
  FacebookScraperConfig,
  FacebookScrapeResult,
} from './facebook-types.js'
import { DEFAULT_FB_SCRAPER_CONFIG, buildCookieHeader } from './facebook-types.js'
import { extractPageIdentifier } from './facebook-url-utils.js'
import { extractGraphQLTokens } from './facebook-graphql-token-extractor.js'

const GRAPHQL_ENDPOINT = 'https://www.facebook.com/api/graphql/'
const GRAPHQL_DOMAIN = 'www.facebook.com'

// Known doc_ids for page timeline — these may break when Meta redeploys
const PAGE_FEED_DOC_ID = '10159643514786617'

export class FacebookGraphQLScraper {
  private userAgentPool = new UserAgentPool()
  private rateLimiter: DomainRateLimiter
  private config: FacebookScraperConfig

  constructor(config?: Partial<FacebookScraperConfig>) {
    this.config = { ...DEFAULT_FB_SCRAPER_CONFIG, ...config }
    // Stricter rate limit: 6 req/min for GraphQL
    this.rateLimiter = new DomainRateLimiter({ maxPerMinute: 6, maxConcurrent: 1 })
  }

  async scrapePagePosts(
    pageUrl: string,
    cookies: FacebookCookies,
    options?: Partial<FacebookScraperConfig>
  ): Promise<FacebookScrapeResult> {
    const config = { ...this.config, ...options }
    const startedAt = new Date()
    const errors: string[] = []
    const allPosts: FacebookPost[] = []
    const pageId = extractPageIdentifier(pageUrl)
    let pagesVisited = 0

    console.warn('[FacebookGraphQLScraper] WARNING: GraphQL scraper is experimental. Account suspension possible.')

    let tokens: FacebookGraphQLTokens
    try {
      tokens = await extractGraphQLTokens(cookies)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        pageUrl, pageName: pageId, posts: [], totalScraped: 0,
        pagesVisited: 0, errors: [`Token extraction failed: ${msg}`],
        startedAt, completedAt: new Date(),
      }
    }

    let cursor: string | null = null
    let hasNext = true

    while (hasNext && pagesVisited < config.maxPages && allPosts.length < config.maxPosts) {
      pagesVisited++

      try {
        const result = await this.executeQuery(pageId, tokens, cookies, cursor)
        const edges = result?.data?.node?.timeline_feed_units?.edges ?? []

        for (const edge of edges) {
          if (allPosts.length >= config.maxPosts) break
          const post = this.parseEdgeToPost(edge, pageId)
          if (post) allPosts.push(post)
        }

        const pageInfo = result?.data?.node?.timeline_feed_units?.page_info
        hasNext = pageInfo?.has_next_page ?? false
        cursor = pageInfo?.end_cursor ?? null
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`GraphQL page ${pagesVisited}: ${msg}`)
        break
      }

      if (hasNext && cursor) {
        await new Promise((r) => setTimeout(r, config.requestDelayMs))
      }
    }

    return {
      pageUrl,
      pageName: pageId,
      posts: allPosts,
      totalScraped: allPosts.length,
      pagesVisited,
      errors,
      startedAt,
      completedAt: new Date(),
    }
  }

  private async executeQuery(
    pageId: string,
    tokens: FacebookGraphQLTokens,
    cookies: FacebookCookies,
    cursor: string | null
  ): Promise<any> {
    await this.rateLimiter.waitForSlot(GRAPHQL_DOMAIN)

    const variables = JSON.stringify({
      pageID: pageId,
      cursor: cursor || '',
      count: 10,
    })

    const body = new URLSearchParams({
      doc_id: PAGE_FEED_DOC_ID,
      variables,
      fb_dtsg: tokens.fbDtsg,
      lsd: tokens.lsd,
      jazoest: tokens.jazoest,
    })

    const userAgent = this.userAgentPool.getAgent({ deviceType: 'desktop' })
    const headers: Record<string, string> = {
      ...getStealthHeaders(GRAPHQL_ENDPOINT),
      'User-Agent': userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: buildCookieHeader(cookies),
    }

    const result = await withRetry(
      async () => {
        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers,
          body: body.toString(),
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`)
        return res.json()
      },
      2,
      5000
    )

    this.rateLimiter.recordRequest(GRAPHQL_DOMAIN)
    return result
  }

  private parseEdgeToPost(edge: any, pageId: string): FacebookPost | null {
    try {
      const node = edge?.node
      if (!node) return null

      const story = node.comet_sections?.content?.story?.comet_sections?.message?.story?.message
      const text = story?.text || ''
      const postId = node.post_id || node.id || ''

      return {
        postId,
        permalink: `https://www.facebook.com/${pageId}/posts/${postId}`,
        text,
        author: node.comet_sections?.context_layout?.story?.comet_sections?.actor_photo?.story?.actors?.[0]?.name || pageId,
        authorUrl: null,
        timestamp: node.created_time ? new Date(node.created_time * 1000) : null,
        timestampRaw: node.created_time ? new Date(node.created_time * 1000).toISOString() : '',
        images: this.extractGraphQLImages(node),
        videos: [],
        reactions: node.feedback?.reactors?.count ?? 0,
        comments: node.feedback?.comment_count?.total_count ?? 0,
        shares: node.feedback?.share_count?.count ?? null,
        scrapedAt: new Date(),
        source: 'graphql',
      }
    } catch {
      return null
    }
  }

  private extractGraphQLImages(node: any): string[] {
    try {
      const attachments = node.comet_sections?.content?.story?.attachments ?? []
      const images: string[] = []
      for (const a of attachments) {
        const media = a?.styles?.attachment?.media
        if (media?.photo?.image?.uri) images.push(media.photo.image.uri)
        if (media?.image?.uri) images.push(media.image.uri)
      }
      return images
    } catch {
      return []
    }
  }
}
