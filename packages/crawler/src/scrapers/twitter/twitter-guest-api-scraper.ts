import { HttpClient } from '../../lib/http-client.js'
import type {
  TwitterProfile,
  Tweet,
  TwitterScraperConfig,
  TwitterScrapeResult,
} from './twitter-types.js'
import { DEFAULT_TWITTER_CONFIG } from './twitter-types.js'
import { buildGuestTokenUrl, extractHandle, buildUserTimelineUrl } from './twitter-url-utils.js'

export class TwitterGuestApiScraper {
  private httpClient: HttpClient
  private config: TwitterScraperConfig
  private bearerToken = process.env.TWITTER_BEARER_TOKEN ?? 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

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

    let profile: TwitterProfile | null = null
    const tweets: Tweet[] = []

    try {
      // Step 1: Activate guest token
      const guestToken = await this.activateGuestToken()

      // Step 2: Fetch user data via GraphQL
      const userData = await this.fetchUserByScreenName(handle, guestToken)

      if (userData) {
        profile = {
          handle: userData.screen_name || handle,
          name: userData.name || handle,
          bio: userData.description || '',
          followerCount: userData.followers_count || 0,
          followingCount: userData.friends_count || 0,
          tweetCount: userData.statuses_count || 0,
          isVerified: userData.verified || false,
          profileImageUrl: userData.profile_image_url_https || userData.profile_image_url || '',
          bannerUrl: userData.profile_banner_url || null,
        }

        // Step 3: Fetch user timeline
        const timelineTweets = await this.fetchUserTimeline(userData.id_str, guestToken)

        for (const tweetData of timelineTweets) {
          try {
            const mediaUrls: string[] = []
            const media = tweetData.entities?.media || tweetData.extended_entities?.media || []

            for (const m of media) {
              if (m.media_url_https) {
                mediaUrls.push(m.media_url_https)
              }
            }

            tweets.push({
              id: tweetData.id_str,
              text: tweetData.full_text || tweetData.text || '',
              likeCount: tweetData.favorite_count || 0,
              retweetCount: tweetData.retweet_count || 0,
              replyCount: tweetData.reply_count || 0,
              timestamp: new Date(tweetData.created_at),
              mediaUrls,
              isRetweet: !!tweetData.retweeted_status,
            })

            if (tweets.length >= this.config.maxTweets) break
          } catch (err) {
            errors.push(`Failed to parse tweet ${tweetData.id_str}: ${err instanceof Error ? err.message : String(err)}`)
          }
        }
      }

      await this.delay(this.config.requestDelayMs)
    } catch (err) {
      errors.push(`Guest API scraping failed: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }

    return {
      profileUrl: buildUserTimelineUrl(handle),
      profile,
      tweets,
      totalScraped: tweets.length,
      errors,
      source: 'guest-api',
      startedAt,
      completedAt: new Date(),
    }
  }

  private async activateGuestToken(): Promise<string> {
    const response = await this.httpClient.post(buildGuestTokenUrl(), '', {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json',
      },
      proxyUrl: this.config.proxy,
    })

    const data = JSON.parse(response.body)
    if (!data.guest_token) {
      throw new Error('Failed to activate guest token')
    }

    return data.guest_token
  }

  private async fetchUserByScreenName(screenName: string, guestToken: string): Promise<any> {
    const url = `https://api.x.com/1.1/users/show.json?screen_name=${encodeURIComponent(screenName)}`

    const response = await this.httpClient.get(url, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'x-guest-token': guestToken,
      },
      proxyUrl: this.config.proxy,
    })

    return JSON.parse(response.body)
  }

  private async fetchUserTimeline(userId: string, guestToken: string): Promise<any[]> {
    const variables = {
      userId,
      count: this.config.maxTweets,
      includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: false,
      withVoice: false,
      withV2Timeline: true,
    }

    const features = {
      rweb_lists_timeline_redesign_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      longform_notetweets_rich_text_read_enabled: true,
      responsive_web_enhance_cards_enabled: false,
    }

    const url = `https://x.com/i/api/graphql/V7H0Ap3_Hh2FyS75OCDO3Q/UserTweets?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`

    const response = await this.httpClient.get(url, {
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'x-guest-token': guestToken,
        'Content-Type': 'application/json',
      },
      proxyUrl: this.config.proxy,
    })

    const data = JSON.parse(response.body)
    const instructions = data?.data?.user?.result?.timeline_v2?.timeline?.instructions || []

    const tweets: any[] = []
    for (const instruction of instructions) {
      if (instruction.type === 'TimelineAddEntries') {
        for (const entry of instruction.entries || []) {
          const content = entry.content
          if (content?.itemContent?.tweet_results?.result?.legacy) {
            tweets.push(content.itemContent.tweet_results.result.legacy)
          }
        }
      }
    }

    return tweets
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
