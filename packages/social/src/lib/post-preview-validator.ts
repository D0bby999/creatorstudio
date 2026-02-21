// Post preview generation and validation engine
// Pure functions — no DB, no network, no side effects

import type {
  SocialPlatform,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PostPreview,
  CharacterBudget,
} from '../types/social-types'
import { PLATFORM_CONTENT_RULES } from './content-adaptation-rules'
import { adaptContent } from './content-adapter'

const URL_REGEX = /https?:\/\/[^\s]+/g

interface ValidatePostOptions {
  maxMediaCount?: number
  mediaCount?: number
}

export function validatePost(
  content: string,
  platform: SocialPlatform,
  options?: ValidatePostOptions
): ValidationResult {
  const rules = PLATFORM_CONTENT_RULES[platform]
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  if (!content || content.trim().length === 0) {
    errors.push({ code: 'empty_content', message: 'Post content cannot be empty' })
    return { valid: false, errors, warnings }
  }

  const budget = getCharacterBudget(content, platform)

  if (budget.remaining < 0) {
    errors.push({
      code: 'over_char_limit',
      message: `Content exceeds ${rules.maxChars} character limit by ${Math.abs(budget.remaining)} characters`,
    })
  }

  if (budget.percentage >= 90 && budget.remaining >= 0) {
    warnings.push({
      code: 'near_char_limit',
      message: `Content uses ${budget.percentage}% of the ${rules.maxChars} character limit`,
      platform,
    })
  }

  const hashtags = content.match(/#\w+/g) ?? []
  if (rules.maxHashtags === 0 && hashtags.length > 0) {
    warnings.push({
      code: 'hashtags_will_strip',
      message: `${platform} does not support hashtags — they will be removed`,
      platform,
    })
  } else if (hashtags.length > rules.maxHashtags) {
    errors.push({
      code: 'over_hashtag_limit',
      message: `Too many hashtags: ${hashtags.length} (max ${rules.maxHashtags})`,
    })
  }

  if (rules.linkChars === 0) {
    const links = content.match(URL_REGEX) ?? []
    if (links.length > 0) {
      warnings.push({
        code: 'links_not_clickable',
        message: `Links are not clickable on ${platform}`,
        platform,
      })
    }
  }

  if (options?.maxMediaCount !== undefined && options.mediaCount !== undefined) {
    if (options.mediaCount > options.maxMediaCount) {
      errors.push({
        code: 'over_media_count',
        message: `Too many media files: ${options.mediaCount} (max ${options.maxMediaCount})`,
      })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function previewPost(content: string, platforms: SocialPlatform[]): PostPreview[] {
  return platforms.map((platform) => {
    const adapted = adaptContent(content, platform)
    const budget = getCharacterBudget(content, platform)

    return {
      platform,
      content: adapted.content,
      characterBudget: budget,
      metadata: adapted.metadata,
      warnings: adapted.warnings,
    }
  })
}

export function getCharacterBudget(content: string, platform: SocialPlatform): CharacterBudget {
  const rules = PLATFORM_CONTENT_RULES[platform]
  const links = content.match(URL_REGEX) ?? []

  let effectiveLength = content.length
  if (rules.linkChars > 0 && links.length > 0) {
    const actualLinkChars = links.reduce((sum, l) => sum + l.length, 0)
    effectiveLength = content.length - actualLinkChars + links.length * rules.linkChars
  }

  const remaining = rules.maxChars - effectiveLength
  const percentage = Math.min(100, Math.round((effectiveLength / rules.maxChars) * 100))

  return { used: effectiveLength, remaining, max: rules.maxChars, percentage }
}
