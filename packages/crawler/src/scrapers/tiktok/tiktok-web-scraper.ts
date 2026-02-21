import { HttpClient } from '../../lib/http-client.js'
import { getStealthHeaders } from '../../stealth/stealth-headers.js'
import type {
  TikTokProfile,
  TikTokVideo,
  TikTokScrapeResult,
  TikTokScraperConfig,
} from './tiktok-types.js'
import { DEFAULT_TIKTOK_CONFIG } from './tiktok-types.js'
import { buildProfileUrl, extractUsername } from './tiktok-url-utils.js'
import * as cheerio from 'cheerio'

export class TikTokWebScraper {
  private httpClient: HttpClient
  private config: TikTokScraperConfig

  constructor(config?: Partial<TikTokScraperConfig>) {
    this.httpClient = new HttpClient(30000)
    this.config = { ...DEFAULT_TIKTOK_CONFIG, ...config }
  }

  async scrapeProfile(profileUrl: string): Promise<TikTokScrapeResult> {
    const startedAt = new Date()
    const errors: string[] = []

    const username = extractUsername(profileUrl)
    if (!username) {
      throw new Error('Could not extract username from URL')
    }

    const url = buildProfileUrl(username)
    let profile: TikTokProfile | null = null
    const videos: TikTokVideo[] = []

    try {
      const headers = getStealthHeaders('tiktok.com')
      const response = await this.httpClient.get(url, {
        headers: {
          ...headers,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        proxyUrl: this.config.proxy,
      })

      const $ = cheerio.load(response.body)

      // Extract JSON data from script tag
      const scriptTag = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').html()
      if (!scriptTag) {
        throw new Error('Could not find __UNIVERSAL_DATA_FOR_REHYDRATION__ script tag')
      }

      const jsonData = JSON.parse(scriptTag)
      const userDetail = jsonData?.__DEFAULT_SCOPE__?.['webapp.user-detail']

      if (!userDetail) {
        throw new Error('Could not extract user detail data from page')
      }

      // Parse profile data
      const userInfo = userDetail.userInfo?.user
      if (userInfo) {
        profile = {
          username: userInfo.uniqueId || username,
          nickname: userInfo.nickname || '',
          bio: userInfo.signature || '',
          followerCount: parseInt(userInfo.followerCount || '0', 10),
          followingCount: parseInt(userInfo.followingCount || '0', 10),
          likeCount: parseInt(userInfo.heartCount || '0', 10),
          isVerified: userInfo.verified === true,
          avatarUrl: userInfo.avatarLarger || userInfo.avatarMedium || '',
        }
      }

      // Parse video data
      const videoList = userDetail.itemList || []
      for (const item of videoList.slice(0, this.config.maxVideos)) {
        try {
          videos.push({
            id: item.id,
            description: item.desc || '',
            likeCount: parseInt(item.stats?.diggCount || '0', 10),
            commentCount: parseInt(item.stats?.commentCount || '0', 10),
            shareCount: parseInt(item.stats?.shareCount || '0', 10),
            viewCount: parseInt(item.stats?.playCount || '0', 10),
            timestamp: new Date(item.createTime * 1000),
            videoUrl: item.video?.downloadAddr || '',
            coverUrl: item.video?.cover || '',
            musicTitle: item.music?.title || null,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`Failed to parse video ${item.id}: ${msg}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Web scraping failed: ${msg}`)
      throw err
    }

    return {
      profileUrl: url,
      profile,
      videos,
      totalScraped: videos.length,
      errors,
      source: 'web',
      startedAt,
      completedAt: new Date(),
    }
  }
}
