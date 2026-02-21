import * as cheerio from 'cheerio'
import { HttpClient } from '../../lib/http-client.js'
import type {
  TwitterProfile,
  Tweet,
  TwitterScraperConfig,
  TwitterScrapeResult,
} from './twitter-types.js'
import { DEFAULT_TWITTER_CONFIG } from './twitter-types.js'
import { buildSyndicationUrl, extractHandle, buildUserTimelineUrl } from './twitter-url-utils.js'

export class TwitterWebScraper {
  private httpClient: HttpClient
  private config: TwitterScraperConfig

  constructor(config: Partial<TwitterScraperConfig> = {}) {
    this.httpClient = new HttpClient(30000)
    this.config = { ...DEFAULT_TWITTER_CONFIG, ...config }
  }

  async scrapeProfile(profileUrl: string): Promise<TwitterScrapeResult> {
    const startedAt = new Date()
    const errors: string[] = []

    const handle = extractHandle(profileUrl)
    if (!handle) {
      throw new Error(`Invalid Twitter URL: ${profileUrl}`)
    }

    const syndicationUrl = buildSyndicationUrl(handle)
    let profile: TwitterProfile | null = null
    const tweets: Tweet[] = []

    try {
      const response = await this.httpClient.get(syndicationUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        proxyUrl: this.config.proxy,
      })

      const $ = cheerio.load(response.body)

      // Extract profile info from syndication timeline
      const profileCard = $('.timeline-Header')
      if (profileCard.length > 0) {
        const nameEl = profileCard.find('.timeline-Header-title')
        const bioEl = profileCard.find('.timeline-Header-bio')
        const avatarEl = profileCard.find('.timeline-Header-avatar img')

        profile = {
          handle,
          name: nameEl.text().trim() || handle,
          bio: bioEl.text().trim() || '',
          followerCount: 0, // Not available in syndication
          followingCount: 0, // Not available in syndication
          tweetCount: 0, // Not available in syndication
          isVerified: profileCard.find('.Icon--verified').length > 0,
          profileImageUrl: avatarEl.attr('src') || '',
          bannerUrl: null, // Not available in syndication
        }
      }

      // Extract tweets
      const tweetElements = $('.timeline-Tweet')
      const maxTweets = Math.min(this.config.maxTweets, tweetElements.length)

      for (let i = 0; i < maxTweets; i++) {
        const tweetEl = tweetElements.eq(i)

        try {
          const tweetId = tweetEl.attr('data-tweet-id') || tweetEl.attr('id')?.replace('tweet-', '') || ''
          const text = tweetEl.find('.timeline-Tweet-text').text().trim()
          const timestamp = tweetEl.find('time').attr('datetime')
          const isRetweet = tweetEl.find('.timeline-Tweet-retweetCredit').length > 0

          const mediaUrls: string[] = []
          tweetEl.find('.timeline-Tweet-media img').each((_, img) => {
            const src = $(img).attr('src')
            if (src) mediaUrls.push(src)
          })

          tweets.push({
            id: tweetId,
            text,
            likeCount: 0, // Not available in syndication
            retweetCount: 0, // Not available in syndication
            replyCount: 0, // Not available in syndication
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            mediaUrls,
            isRetweet,
          })
        } catch (err) {
          errors.push(`Failed to parse tweet ${i}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      await this.delay(this.config.requestDelayMs)
    } catch (err) {
      errors.push(`Syndication scraping failed: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }

    return {
      profileUrl: buildUserTimelineUrl(handle),
      profile,
      tweets,
      totalScraped: tweets.length,
      errors,
      source: 'syndication',
      startedAt,
      completedAt: new Date(),
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
