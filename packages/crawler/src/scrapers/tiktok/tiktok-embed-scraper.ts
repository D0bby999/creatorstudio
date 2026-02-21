import { HttpClient } from '../../lib/http-client.js'
import type { TikTokScrapeResult, TikTokScraperConfig, TikTokVideo } from './tiktok-types.js'
import { DEFAULT_TIKTOK_CONFIG } from './tiktok-types.js'
import { buildOembedUrl } from './tiktok-url-utils.js'

interface TikTokOEmbedResponse {
  version: string
  type: string
  title: string
  author_url: string
  author_name: string
  width: string
  height: string
  html: string
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
  provider_url: string
  provider_name: string
}

export class TikTokEmbedScraper {
  private httpClient: HttpClient
  private config: TikTokScraperConfig

  constructor(config?: Partial<TikTokScraperConfig>) {
    this.httpClient = new HttpClient(30000)
    this.config = { ...DEFAULT_TIKTOK_CONFIG, ...config }
  }

  async scrapeVideo(videoUrl: string): Promise<TikTokScrapeResult> {
    const startedAt = new Date()
    const errors: string[] = []
    const videos: TikTokVideo[] = []

    try {
      const oembedUrl = buildOembedUrl(videoUrl)
      const response = await this.httpClient.get(oembedUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; CreatorStudio/1.0)',
        },
        proxyUrl: this.config.proxy,
      })

      const data: TikTokOEmbedResponse = JSON.parse(response.body)

      // Extract video ID from author_url or embed HTML
      const videoIdMatch = videoUrl.match(/\/video\/(\d+)/)
      const videoId = videoIdMatch ? videoIdMatch[1] : Date.now().toString()

      videos.push({
        id: videoId,
        description: data.title || '',
        likeCount: 0, // oEmbed doesn't provide engagement metrics
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
        timestamp: new Date(),
        videoUrl,
        coverUrl: data.thumbnail_url || '',
        musicTitle: null,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`oEmbed scraping failed: ${msg}`)
      throw err
    }

    return {
      profileUrl: videoUrl,
      profile: null, // oEmbed doesn't provide full profile data
      videos,
      totalScraped: videos.length,
      errors,
      source: 'embed',
      startedAt,
      completedAt: new Date(),
    }
  }
}
