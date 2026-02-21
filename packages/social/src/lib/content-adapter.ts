// Platform-specific content adaptation — pure functions, no side effects
// Handles char limits, hashtag caps, link counting, truncation warnings

import type { SocialPlatform, AdaptedContent, ContentWarning } from '../types/social-types'
import { PLATFORM_CONTENT_RULES } from './content-adaptation-rules'

const URL_REGEX = /https?:\/\/[^\s]+/g
const HASHTAG_REGEX = /#\w+/g
const MENTION_REGEX = /@\w+/g

export function adaptContent(content: string, platform: SocialPlatform): AdaptedContent {
  const rules = PLATFORM_CONTENT_RULES[platform]
  const warnings: ContentWarning[] = []
  let adapted = content

  // Extract metrics before modification
  const links = content.match(URL_REGEX) ?? []
  const mentions = content.match(MENTION_REGEX) ?? []

  // Handle link char counting (Twitter shortens all URLs to 23 chars)
  let effectiveLength = adapted.length
  if (rules.linkChars > 0 && links.length > 0) {
    const actualLinkChars = links.reduce((sum, l) => sum + l.length, 0)
    const shortenedChars = links.length * rules.linkChars
    effectiveLength = adapted.length - actualLinkChars + shortenedChars

    warnings.push({
      type: 'links_counted_as_shortened',
      platform,
      charsPer: rules.linkChars,
    })
  }

  // Enforce hashtag limits
  const hashtags = adapted.match(HASHTAG_REGEX) ?? []
  if (rules.maxHashtags === 0 && hashtags.length > 0) {
    // Strip all hashtags (e.g. Bluesky)
    adapted = adapted.replace(HASHTAG_REGEX, '').replace(/\s{2,}/g, ' ').trim()
    warnings.push({
      type: 'hashtags_stripped',
      removed: hashtags,
      maxAllowed: 0,
    })
  } else if (hashtags.length > rules.maxHashtags) {
    const toRemove = hashtags.slice(rules.maxHashtags)
    for (const tag of toRemove) {
      adapted = adapted.replace(tag, '').trim()
    }
    adapted = adapted.replace(/\s{2,}/g, ' ').trim()
    warnings.push({
      type: 'hashtags_stripped',
      removed: toRemove,
      maxAllowed: rules.maxHashtags,
    })
  }

  // Recalculate effective length after hashtag stripping
  const remainingLinks = adapted.match(URL_REGEX) ?? []
  if (rules.linkChars > 0 && remainingLinks.length > 0) {
    const actualLinkChars = remainingLinks.reduce((sum, l) => sum + l.length, 0)
    effectiveLength = adapted.length - actualLinkChars + remainingLinks.length * rules.linkChars
  } else {
    effectiveLength = adapted.length
  }

  // Truncate if over limit
  const truncated = effectiveLength > rules.maxChars
  if (truncated) {
    const overflow = effectiveLength - rules.maxChars
    adapted = adapted.slice(0, adapted.length - overflow - 3) + '...'
    warnings.push({
      type: 'truncated',
      originalLength: effectiveLength,
      maxLength: rules.maxChars,
    })
  }

  const finalHashtags = adapted.match(HASHTAG_REGEX) ?? []
  const finalMentions = adapted.match(MENTION_REGEX) ?? []
  const finalLinks = adapted.match(URL_REGEX) ?? []

  return {
    content: adapted,
    platform,
    warnings,
    metadata: {
      characterCount: adapted.length,
      hashtagCount: finalHashtags.length,
      mentionCount: finalMentions.length,
      linkCount: finalLinks.length,
      truncated,
    },
  }
}

export function adaptForMultiplePlatforms(
  content: string,
  platforms: SocialPlatform[]
): AdaptedContent[] {
  return platforms.map((platform) => adaptContent(content, platform))
}
