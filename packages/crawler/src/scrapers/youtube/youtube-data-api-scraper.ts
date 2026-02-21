import { HttpClient } from '../../lib/http-client.js'
import type {
  YouTubeChannel,
  YouTubeVideo,
  YouTubeScrapeResult,
  YouTubeScraperConfig,
} from './youtube-types.js'
import { DEFAULT_YT_CONFIG } from './youtube-types.js'
import { extractChannelId } from './youtube-url-utils.js'

interface YouTubeDataApiChannelResponse {
  items: Array<{
    id: string
    snippet: {
      title: string
      description: string
      customUrl?: string
      thumbnails: {
        high?: { url: string }
        medium?: { url: string }
        default?: { url: string }
      }
    }
    statistics: {
      viewCount: string
      subscriberCount: string
      videoCount: string
    }
    brandingSettings?: {
      image?: {
        bannerExternalUrl?: string
      }
    }
  }>
}

interface YouTubeDataApiSearchResponse {
  items: Array<{
    id: {
      videoId: string
    }
  }>
}

interface YouTubeDataApiVideoResponse {
  items: Array<{
    id: string
    snippet: {
      title: string
      description: string
      publishedAt: string
      channelId: string
      thumbnails: {
        high?: { url: string }
        medium?: { url: string }
        default?: { url: string }
      }
    }
    contentDetails: {
      duration: string
    }
    statistics: {
      viewCount: string
      likeCount: string
      commentCount: string
    }
  }>
}

export class YouTubeDataApiScraper {
  private httpClient: HttpClient
  private config: YouTubeScraperConfig

  constructor(config?: Partial<YouTubeScraperConfig>) {
    this.httpClient = new HttpClient(30000)
    this.config = { ...DEFAULT_YT_CONFIG, ...config }
  }

  async scrapeChannel(channelUrl: string, apiKey?: string): Promise<YouTubeScrapeResult> {
    const startedAt = new Date()
    const errors: string[] = []
    let channel: YouTubeChannel | null = null
    const videos: YouTubeVideo[] = []

    const key = apiKey || this.config.apiKey || process.env.YOUTUBE_API_KEY
    if (!key) {
      throw new Error('YouTube Data API key is required (pass apiKey or set YOUTUBE_API_KEY env var)')
    }

    try {
      const channelId = extractChannelId(channelUrl)
      if (!channelId) {
        throw new Error('Could not extract channel identifier from URL')
      }

      // Fetch channel details
      const channelResponse = await this.httpClient.get(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${key}`,
        { proxyUrl: this.config.proxy }
      )

      const channelData: YouTubeDataApiChannelResponse = JSON.parse(channelResponse.body)

      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('Channel not found')
      }

      const item = channelData.items[0]
      channel = {
        id: item.id,
        name: item.snippet.title,
        description: item.snippet.description,
        subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
        videoCount: parseInt(item.statistics.videoCount || '0', 10),
        viewCount: parseInt(item.statistics.viewCount || '0', 10),
        customUrl: item.snippet.customUrl || null,
        thumbnailUrl:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url ||
          '',
        bannerUrl: item.brandingSettings?.image?.bannerExternalUrl || null,
      }

      // Search for videos in the channel
      const searchResponse = await this.httpClient.get(
        `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channel.id}&order=date&type=video&maxResults=${this.config.maxVideos}&key=${key}`,
        { proxyUrl: this.config.proxy }
      )

      const searchData: YouTubeDataApiSearchResponse = JSON.parse(searchResponse.body)
      const videoIds = searchData.items.map((item) => item.id.videoId).join(',')

      if (videoIds) {
        // Fetch video details
        const videosResponse = await this.httpClient.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${key}`,
          { proxyUrl: this.config.proxy }
        )

        const videosData: YouTubeDataApiVideoResponse = JSON.parse(videosResponse.body)

        for (const video of videosData.items) {
          try {
            videos.push({
              id: video.id,
              title: video.snippet.title,
              description: video.snippet.description,
              viewCount: parseInt(video.statistics.viewCount || '0', 10),
              likeCount: parseInt(video.statistics.likeCount || '0', 10),
              commentCount: parseInt(video.statistics.commentCount || '0', 10),
              publishedAt: new Date(video.snippet.publishedAt),
              thumbnailUrl:
                video.snippet.thumbnails.high?.url ||
                video.snippet.thumbnails.medium?.url ||
                video.snippet.thumbnails.default?.url ||
                '',
              duration: this.formatDuration(video.contentDetails.duration),
              channelId: video.snippet.channelId,
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push(`Failed to parse video ${video.id}: ${msg}`)
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`YouTube Data API scraping failed: ${msg}`)
      throw err
    }

    return {
      channelUrl,
      channel,
      videos,
      totalScraped: videos.length,
      errors,
      source: 'data-api',
      startedAt,
      completedAt: new Date(),
    }
  }

  private formatDuration(isoDuration: string): string {
    // Convert ISO 8601 duration (PT1H2M3S) to human-readable format (1:02:03)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return '0:00'

    const hours = parseInt(match[1] || '0', 10)
    const minutes = parseInt(match[2] || '0', 10)
    const seconds = parseInt(match[3] || '0', 10)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
