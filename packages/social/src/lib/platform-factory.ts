// Factory for creating platform-specific social media clients
// Centralizes platform configuration and client instantiation

import type { SocialPlatform } from '../types/social-types'
import type { SocialPlatformClient, PlatformConfig } from './platform-interface'
import { InstagramClient } from './instagram-client'
import { TwitterClient } from './twitter-client'
import { LinkedInClient } from './linkedin-client'
import { BlueskyClient } from './bluesky-client'
import { FacebookClient } from './facebook-client'
import { ThreadsClient } from './threads-client'
import { TikTokClient } from './tiktok-client'
import { createResilientFetch, PLATFORM_RATE_LIMITS } from './resilience'
import { isRetryable } from './error-taxonomy'
import { createLogger } from './social-logger'
import type { ClientOptions } from './client-options'
import { PlatformHealthTracker } from './platform-health-tracker'

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  instagram: {
    maxContentLength: 2200,
    maxMediaCount: 10,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    hashtagSupport: true,
  },
  twitter: {
    maxContentLength: 280,
    maxMediaCount: 4,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    hashtagSupport: true,
  },
  linkedin: {
    maxContentLength: 3000,
    maxMediaCount: 9,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    hashtagSupport: true,
  },
  bluesky: {
    maxContentLength: 300,
    maxMediaCount: 4,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif'],
    hashtagSupport: false,
  },
  facebook: {
    maxContentLength: 63206,
    maxMediaCount: 10,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    hashtagSupport: true,
  },
  threads: {
    maxContentLength: 500,
    maxMediaCount: 20,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    hashtagSupport: true,
  },
  tiktok: {
    maxContentLength: 2200,
    maxMediaCount: 1,
    supportedMediaTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    hashtagSupport: true,
  },
}

export interface PlatformClientParams {
  handle?: string
  appPassword?: string
  pageId?: string
  pageAccessToken?: string
  openId?: string
  userId?: string
  appId?: string
  appSecret?: string
  clientKey?: string
  clientSecret?: string
  refreshToken?: string
}

export function getPlatformClient(
  platform: SocialPlatform,
  accessToken: string,
  additionalParams?: PlatformClientParams
): SocialPlatformClient {
  const clientOpts = buildClientOptions(platform)

  switch (platform) {
    case 'instagram':
      return new InstagramClient(accessToken, clientOpts)
    case 'twitter':
      return new TwitterClient(accessToken)
    case 'linkedin':
      return new LinkedInClient(accessToken)
    case 'bluesky':
      if (!additionalParams?.handle || !additionalParams?.appPassword) {
        throw new Error('Bluesky requires handle and appPassword')
      }
      return new BlueskyClient(additionalParams.handle, additionalParams.appPassword, clientOpts)
    case 'facebook':
      if (!additionalParams?.pageId || !additionalParams?.pageAccessToken) {
        throw new Error('Facebook requires pageId and pageAccessToken')
      }
      return new FacebookClient(
        accessToken,
        additionalParams.pageId,
        additionalParams.pageAccessToken,
        additionalParams.appId,
        additionalParams.appSecret,
        clientOpts
      )
    case 'threads':
      return new ThreadsClient(
        accessToken,
        additionalParams?.userId,
        additionalParams?.appId,
        additionalParams?.appSecret,
        clientOpts
      )
    case 'tiktok':
      return new TikTokClient(
        accessToken,
        additionalParams?.openId,
        additionalParams?.clientKey,
        additionalParams?.clientSecret,
        additionalParams?.refreshToken,
        clientOpts
      )
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

function buildClientOptions(platform: string): ClientOptions {
  const logger = createLogger(`social:${platform}`)
  const rateLimits = PLATFORM_RATE_LIMITS[platform]
  const healthTracker = PlatformHealthTracker.getInstance()

  const resilientFetch = createResilientFetch({
    platform,
    rateLimiter: rateLimits,
    retry: { shouldRetry: isRetryable },
    circuitBreaker: {
      onStateChange: (from, to) => {
        healthTracker.recordCircuitChange(platform, to)
        logger.warn('Circuit breaker state change', { from, to })
      },
    },
    onRequest: (url) => logger.debug('API request', { url }),
    onResponse: (url, status, latencyMs) => {
      healthTracker.record(platform, status, latencyMs)
      logger.info('API response', { url, status, latencyMs })
    },
    onError: (url, error) =>
      logger.error('API error', { url, error: String(error) }),
  })

  return { fetchFn: resilientFetch, logger }
}

export function getPlatformConfig(platform: SocialPlatform): PlatformConfig {
  return PLATFORM_CONFIGS[platform]
}
