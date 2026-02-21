// Platform-specific media rules for multi-platform media validation
// Pure data — no logic, no side effects (same pattern as content-adaptation-rules.ts)

import type { SocialPlatform, MediaRules } from '../types/social-types'

const MB = 1024 * 1024

export const PLATFORM_MEDIA_RULES: Record<SocialPlatform, MediaRules> = {
  twitter: {
    maxFileSize: 5 * MB,
    acceptedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxWidth: 4096,
    maxHeight: 4096,
    minWidth: 2,
    minHeight: 2,
  },
  instagram: {
    maxFileSize: 8 * MB,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxWidth: 1440,
    maxHeight: 1440,
    minWidth: 320,
    minHeight: 320,
    recommendedWidth: 1080,
    recommendedHeight: 1080,
  },
  linkedin: {
    maxFileSize: 5 * MB,
    acceptedFormats: ['image/jpeg', 'image/png', 'image/gif'],
    maxWidth: 7680,
    maxHeight: 4320,
  },
  tiktok: {
    maxFileSize: 10 * MB,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxWidth: 1080,
    maxHeight: 1920,
    recommendedWidth: 1080,
    recommendedHeight: 1920,
  },
  facebook: {
    maxFileSize: 10 * MB,
    acceptedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxWidth: 2048,
    maxHeight: 2048,
    recommendedWidth: 1200,
    recommendedHeight: 630,
  },
  threads: {
    maxFileSize: 8 * MB,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxWidth: 1440,
    maxHeight: 1440,
    minWidth: 320,
    minHeight: 320,
    recommendedWidth: 1080,
    recommendedHeight: 1080,
  },
  bluesky: {
    maxFileSize: 1 * MB,
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxWidth: 2000,
    maxHeight: 2000,
  },
}
