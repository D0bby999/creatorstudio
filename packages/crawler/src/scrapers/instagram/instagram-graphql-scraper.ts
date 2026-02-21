import { HttpClient } from '../../lib/http-client.js'
import type {
  InstagramProfile,
  InstagramPost,
  InstagramScraperConfig,
  InstagramScrapeResult,
} from './instagram-types.js'
import { DEFAULT_IG_CONFIG } from './instagram-types.js'
import { buildWebProfileUrl, buildGraphQLUrl, extractUsername } from './instagram-url-utils.js'

export class InstagramGraphQLScraper {
  private httpClient: HttpClient
  private config: InstagramScraperConfig

  constructor(config: Partial<InstagramScraperConfig> = {}) {
    this.httpClient = new HttpClient(30000)
    this.config = { ...DEFAULT_IG_CONFIG, ...config }
  }

  async scrapeProfile(profileUrl: string): Promise<InstagramScrapeResult> {
    const startedAt = new Date()
    const errors: string[] = []

    const username = extractUsername(profileUrl)
    if (!username) {
      throw new Error(`Invalid Instagram URL: ${profileUrl}`)
    }

    const webUrl = buildWebProfileUrl(username)
    let profile: InstagramProfile | null = null
    const posts: InstagramPost[] = []

    try {
      // Step 1: Fetch web profile page to extract query hash and user ID
      const webResponse = await this.httpClient.get(webUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        proxyUrl: this.config.proxy,
      })

      const html = webResponse.body

      // Extract shared data
      const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/)
      if (!sharedDataMatch) {
        throw new Error('Failed to extract _sharedData from page')
      }

      const sharedData = JSON.parse(sharedDataMatch[1])
      const userData = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user

      if (!userData) {
        throw new Error('Failed to extract user data from _sharedData')
      }

      // Build profile object
      profile = {
        username: userData.username || username,
        fullName: userData.full_name || '',
        bio: userData.biography || '',
        followerCount: userData.edge_followed_by?.count || 0,
        followingCount: userData.edge_follow?.count || 0,
        postCount: userData.edge_owner_to_timeline_media?.count || 0,
        isVerified: userData.is_verified || false,
        profilePicUrl: userData.profile_pic_url_hd || userData.profile_pic_url || '',
        externalUrl: userData.external_url || null,
      }

      // Extract query hash for timeline posts (look for queryId pattern)
      const queryIdMatch = html.match(/queryId:"([a-f0-9]{32})"/)
      const userId = userData.id

      if (queryIdMatch && userId) {
        const queryHash = queryIdMatch[1]
        const graphqlUrl = buildGraphQLUrl()

        // Fetch posts via GraphQL
        const variables = JSON.stringify({
          id: userId,
          first: this.config.maxPosts,
        })

        const graphqlResponse = await this.httpClient.get(
          `${graphqlUrl}?query_hash=${queryHash}&variables=${encodeURIComponent(variables)}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'X-Requested-With': 'XMLHttpRequest',
              'Referer': webUrl,
            },
            proxyUrl: this.config.proxy,
          }
        )

        const graphqlData = JSON.parse(graphqlResponse.body)
        const edges = graphqlData?.data?.user?.edge_owner_to_timeline_media?.edges || []

        for (const edge of edges) {
          const node = edge?.node
          if (!node) continue

          try {
            const mediaUrls: string[] = []
            const isVideo = node.__typename === 'GraphVideo' || node.is_video === true

            if (node.display_url) {
              mediaUrls.push(node.display_url)
            }

            // Handle carousel
            if (node.edge_sidecar_to_children?.edges) {
              for (const child of node.edge_sidecar_to_children.edges) {
                if (child.node?.display_url) {
                  mediaUrls.push(child.node.display_url)
                }
              }
            }

            posts.push({
              id: node.id,
              shortcode: node.shortcode,
              caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
              likeCount: node.edge_liked_by?.count || 0,
              commentCount: node.edge_media_to_comment?.count || 0,
              timestamp: new Date(node.taken_at_timestamp * 1000),
              mediaUrls,
              isVideo,
              videoUrl: isVideo ? node.video_url || null : null,
            })
          } catch (err) {
            errors.push(`Failed to parse post ${node?.shortcode}: ${err instanceof Error ? err.message : String(err)}`)
          }
        }
      } else {
        // Fallback: use posts from initial page load
        const edges = userData.edge_owner_to_timeline_media?.edges || []
        const maxPosts = Math.min(this.config.maxPosts, edges.length)

        for (let i = 0; i < maxPosts; i++) {
          const node = edges[i]?.node
          if (!node) continue

          try {
            const mediaUrls: string[] = []
            const isVideo = node.__typename === 'GraphVideo' || node.is_video === true

            if (node.display_url) {
              mediaUrls.push(node.display_url)
            }

            posts.push({
              id: node.id,
              shortcode: node.shortcode,
              caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
              likeCount: node.edge_liked_by?.count || 0,
              commentCount: node.edge_media_to_comment?.count || 0,
              timestamp: new Date(node.taken_at_timestamp * 1000),
              mediaUrls,
              isVideo,
              videoUrl: isVideo ? node.video_url || null : null,
            })
          } catch (err) {
            errors.push(`Failed to parse post ${i}: ${err instanceof Error ? err.message : String(err)}`)
          }
        }
      }

      await this.delay(this.config.requestDelayMs)
    } catch (err) {
      errors.push(`GraphQL scraping failed: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }

    return {
      profileUrl: webUrl,
      profile,
      posts,
      totalScraped: posts.length,
      errors,
      source: 'graphql',
      startedAt,
      completedAt: new Date(),
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
