// Platform-specific content rules for multi-platform post adaptation
// Pure data — no logic, no side effects

import type { SocialPlatform, ContentRules } from '../types/social-types'

export const PLATFORM_CONTENT_RULES: Record<SocialPlatform, ContentRules> = {
  twitter: {
    maxChars: 280,
    maxHashtags: 30,
    linkChars: 23, // t.co shortener — all URLs count as 23 chars
    mentionPrefix: '@',
  },
  instagram: {
    maxChars: 2200,
    maxHashtags: 30,
    linkChars: 0, // links not clickable in captions
    mentionPrefix: '@',
  },
  tiktok: {
    maxChars: 2200,
    maxHashtags: 30,
    linkChars: 0, // no clickable links in caption
    mentionPrefix: '@',
  },
  linkedin: {
    maxChars: 3000,
    maxHashtags: 30,
    linkChars: 0,
    mentionPrefix: '@',
  },
  threads: {
    maxChars: 500,
    maxHashtags: 30,
    linkChars: 0,
    mentionPrefix: '@',
  },
  facebook: {
    maxChars: 63206,
    maxHashtags: 30,
    linkChars: 0,
    mentionPrefix: '@',
  },
  bluesky: {
    maxChars: 300,
    maxHashtags: 0, // no native hashtag support
    linkChars: 0,
    mentionPrefix: '@',
  },
}
