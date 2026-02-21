import { Innertube } from 'youtubei.js'
import type {
  YouTubeChannel,
  YouTubeVideo,
  YouTubeScrapeResult,
  YouTubeScraperConfig,
} from './youtube-types.js'
import { DEFAULT_YT_CONFIG } from './youtube-types.js'
import { extractChannelId } from './youtube-url-utils.js'

export class YouTubeInnertubeScraper {
  private config: YouTubeScraperConfig

  constructor(config?: Partial<YouTubeScraperConfig>) {
    this.config = { ...DEFAULT_YT_CONFIG, ...config }
  }

  async scrapeChannel(channelUrl: string): Promise<YouTubeScrapeResult> {
    const startedAt = new Date()
    const errors: string[] = []
    let channel: YouTubeChannel | null = null
    const videos: YouTubeVideo[] = []

    try {
      const innertube = await Innertube.create()
      const channelId = extractChannelId(channelUrl)

      if (!channelId) {
        throw new Error('Could not extract channel identifier from URL')
      }

      // Fetch channel info
      let channelData
      if (channelId.startsWith('@')) {
        channelData = await innertube.getChannel(channelId)
      } else if (channelId.startsWith('UC')) {
        channelData = await innertube.getChannel(channelId)
      } else {
        // Try as username/custom URL
        channelData = await innertube.getChannel(channelId)
      }

      // Parse channel metadata
      const header = channelData.header as any
      const metadata = channelData.metadata

      channel = {
        id: metadata?.external_id || channelId,
        name: metadata?.title || '',
        description: metadata?.description || '',
        subscriberCount: this.parseSubscriberCount(header?.subscribers?.text || '0'),
        videoCount: 0, // Innertube doesn't always expose this directly
        viewCount: 0, // Not available in header
        customUrl: metadata?.vanity_channel_url || null,
        thumbnailUrl: this.extractThumbnailUrl(header?.author?.thumbnails),
        bannerUrl: this.extractBannerUrl(header?.banner?.thumbnails),
      }

      // Fetch videos from the channel
      const videosTab = await channelData.getVideos()
      const videoList = videosTab?.videos || []

      for (const video of videoList.slice(0, this.config.maxVideos)) {
        const videoData = video as any
        try {
          videos.push({
            id: videoData.id || '',
            title: videoData.title?.text || '',
            description: videoData.description?.text || '',
            viewCount: this.parseViewCount(videoData.view_count?.text || '0'),
            likeCount: 0, // Not available in list view
            commentCount: 0, // Not available in list view
            publishedAt: this.parsePublishedDate(videoData.published?.text || ''),
            thumbnailUrl: this.extractThumbnailUrl(videoData.thumbnails),
            duration: videoData.duration?.text || '',
            channelId: channel.id,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`Failed to parse video ${videoData.id}: ${msg}`)
        }
      }

      // Update video count from results
      channel.videoCount = videoList.length
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Innertube scraping failed: ${msg}`)
      throw err
    }

    return {
      channelUrl,
      channel,
      videos,
      totalScraped: videos.length,
      errors,
      source: 'innertube',
      startedAt,
      completedAt: new Date(),
    }
  }

  private parseSubscriberCount(text: string): number {
    const match = text.match(/([0-9.]+)([KMB])?/)
    if (!match) return 0

    const num = parseFloat(match[1])
    const unit = match[2]

    if (unit === 'K') return Math.floor(num * 1000)
    if (unit === 'M') return Math.floor(num * 1000000)
    if (unit === 'B') return Math.floor(num * 1000000000)
    return Math.floor(num)
  }

  private parseViewCount(text: string): number {
    const match = text.match(/([0-9,]+)/)
    if (!match) return 0
    return parseInt(match[1].replace(/,/g, ''), 10)
  }

  private parsePublishedDate(text: string): Date {
    // Handle relative dates like "2 days ago", "1 month ago"
    const now = new Date()

    const daysMatch = text.match(/(\d+)\s+days?\s+ago/)
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10)
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    }

    const monthsMatch = text.match(/(\d+)\s+months?\s+ago/)
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1], 10)
      return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000)
    }

    const yearsMatch = text.match(/(\d+)\s+years?\s+ago/)
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1], 10)
      return new Date(now.getTime() - years * 365 * 24 * 60 * 60 * 1000)
    }

    return now
  }

  private extractThumbnailUrl(thumbnails: any): string {
    if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
      return ''
    }
    // Get highest quality thumbnail (last in array)
    const thumbnail = thumbnails[thumbnails.length - 1]
    return thumbnail?.url || ''
  }

  private extractBannerUrl(thumbnails: any): string | null {
    if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
      return null
    }
    const banner = thumbnails[thumbnails.length - 1]
    return banner?.url || null
  }
}
