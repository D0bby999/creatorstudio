/**
 * Static platform rules for content adaptation
 * Used by content-repurposer, caption-variants, content-moderator
 */

export interface PlatformAdaptationRule {
  maxChars: number
  minChars: number
  hashtagRange: [min: number, max: number]
  defaultTone: string
  emojiLevel: 'none' | 'low' | 'medium' | 'high'
  ctaStyle: string
}

const PLATFORM_RULES: Record<string, PlatformAdaptationRule> = {
  instagram: {
    maxChars: 2200,
    minChars: 50,
    hashtagRange: [5, 30],
    defaultTone: 'casual',
    emojiLevel: 'high',
    ctaStyle: 'engagement-focused (comment, share, save)',
  },
  twitter: {
    maxChars: 280,
    minChars: 10,
    hashtagRange: [1, 5],
    defaultTone: 'concise',
    emojiLevel: 'low',
    ctaStyle: 'retweet/reply prompt',
  },
  linkedin: {
    maxChars: 3000,
    minChars: 100,
    hashtagRange: [3, 5],
    defaultTone: 'professional',
    emojiLevel: 'low',
    ctaStyle: 'thought leadership (agree/disagree, share experience)',
  },
  tiktok: {
    maxChars: 2200,
    minChars: 20,
    hashtagRange: [3, 8],
    defaultTone: 'enthusiastic',
    emojiLevel: 'high',
    ctaStyle: 'follow/duet/stitch prompt',
  },
  youtube: {
    maxChars: 5000,
    minChars: 100,
    hashtagRange: [3, 15],
    defaultTone: 'educational',
    emojiLevel: 'medium',
    ctaStyle: 'subscribe/like/comment',
  },
  facebook: {
    maxChars: 63206,
    minChars: 20,
    hashtagRange: [1, 5],
    defaultTone: 'conversational',
    emojiLevel: 'medium',
    ctaStyle: 'share/react/comment',
  },
  threads: {
    maxChars: 500,
    minChars: 10,
    hashtagRange: [0, 5],
    defaultTone: 'casual',
    emojiLevel: 'medium',
    ctaStyle: 'reply/repost prompt',
  },
}

const DEFAULT_RULE: PlatformAdaptationRule = {
  maxChars: 2200,
  minChars: 20,
  hashtagRange: [3, 10],
  defaultTone: 'casual',
  emojiLevel: 'medium',
  ctaStyle: 'engage with content',
}

export function getPlatformRule(platform: string): PlatformAdaptationRule {
  return PLATFORM_RULES[platform.toLowerCase()] ?? DEFAULT_RULE
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(PLATFORM_RULES)
}
