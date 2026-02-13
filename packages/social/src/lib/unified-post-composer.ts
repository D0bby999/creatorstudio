// Unified post composer for multi-platform content adaptation
// Handles platform-specific character limits and hashtag extraction

import type { SocialPlatform } from '../types/social-types'
import { PLATFORM_CONFIGS } from './platform-factory'

export interface ComposedPost {
  content: string
  platform: SocialPlatform
  truncated: boolean
  hashtags: string[]
  characterCount: number
}

export function composeForPlatform(
  content: string,
  platform: SocialPlatform
): ComposedPost {
  const config = PLATFORM_CONFIGS[platform]
  const hashtags = extractHashtags(content)
  let finalContent = content
  let truncated = false

  if (finalContent.length > config.maxContentLength) {
    finalContent = finalContent.slice(0, config.maxContentLength - 3) + '...'
    truncated = true
  }

  return {
    content: finalContent,
    platform,
    truncated,
    hashtags,
    characterCount: finalContent.length,
  }
}

export function composeForMultiplePlatforms(
  content: string,
  platforms: SocialPlatform[]
): ComposedPost[] {
  return platforms.map(platform => composeForPlatform(content, platform))
}

function extractHashtags(content: string): string[] {
  const matches = content.match(/#\w+/g)
  return matches ?? []
}
