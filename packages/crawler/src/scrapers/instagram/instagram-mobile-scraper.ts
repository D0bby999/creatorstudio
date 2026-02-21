import { HttpClient } from '../../lib/http-client.js'
import type {
  InstagramProfile,
  InstagramPost,
  InstagramScraperConfig,
  InstagramScrapeResult,
} from './instagram-types.js'
import { DEFAULT_IG_CONFIG } from './instagram-types.js'
import { buildMobileProfileUrl, extractUsername } from './instagram-url-utils.js'

export class InstagramMobileScraper {
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

    const mobileUrl = buildMobileProfileUrl(username)
    let profile: InstagramProfile | null = null
    const posts: InstagramPost[] = []

    try {
      const response = await this.httpClient.get(mobileUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        proxyUrl: this.config.proxy,
      })

      const html = response.body

      // Extract JSON from window._sharedData or window.__additionalDataLoaded
      const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/)
      const additionalDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\);/)

      let jsonData: any = null

      if (sharedDataMatch) {
        try {
          jsonData = JSON.parse(sharedDataMatch[1])
        } catch (err) {
          errors.push(`Failed to parse _sharedData: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      if (!jsonData && additionalDataMatch) {
        try {
          jsonData = JSON.parse(additionalDataMatch[1])
        } catch (err) {
          errors.push(`Failed to parse __additionalDataLoaded: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      if (jsonData) {
        // Extract profile data
        const userData = jsonData?.entry_data?.ProfilePage?.[0]?.graphql?.user

        if (userData) {
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

          // Extract posts
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

              // Handle carousel posts
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
                likeCount: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
                commentCount: node.edge_media_to_comment?.count || node.edge_media_preview_comment?.count || 0,
                timestamp: new Date(node.taken_at_timestamp * 1000),
                mediaUrls,
                isVideo,
                videoUrl: isVideo ? node.video_url || null : null,
              })
            } catch (err) {
              errors.push(`Failed to parse post ${node?.shortcode || i}: ${err instanceof Error ? err.message : String(err)}`)
            }
          }
        }
      }
    } catch (err) {
      errors.push(`HTTP request failed: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }

    await this.delay(this.config.requestDelayMs)

    return {
      profileUrl: mobileUrl,
      profile,
      posts,
      totalScraped: posts.length,
      errors,
      source: 'mobile',
      startedAt,
      completedAt: new Date(),
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
