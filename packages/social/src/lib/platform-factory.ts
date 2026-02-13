// Factory for creating platform-specific social media clients
// Centralizes platform configuration and client instantiation

import type { SocialPlatform } from '../types/social-types'
import type { SocialPlatformClient, PlatformConfig } from './platform-interface'
import { InstagramClient } from './instagram-client'
import { TwitterClient } from './twitter-client'
import { LinkedInClient } from './linkedin-client'
import { BlueskyClient } from './bluesky-client'

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
}

export function getPlatformClient(
  platform: SocialPlatform,
  accessToken: string,
  additionalParams?: { handle?: string; appPassword?: string }
): SocialPlatformClient {
  switch (platform) {
    case 'instagram':
      return new InstagramClient(accessToken)
    case 'twitter':
      return new TwitterClient(accessToken)
    case 'linkedin':
      return new LinkedInClient(accessToken)
    case 'bluesky':
      if (!additionalParams?.handle || !additionalParams?.appPassword) {
        throw new Error('Bluesky requires handle and appPassword')
      }
      return new BlueskyClient(additionalParams.handle, additionalParams.appPassword)
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

export function getPlatformConfig(platform: SocialPlatform): PlatformConfig {
  return PLATFORM_CONFIGS[platform]
}
