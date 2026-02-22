/**
 * Content quality scoring with engagement metrics
 */

export type QualityPlatform = 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'facebook' | 'threads'

export interface EngagementScores {
  hookStrength: number    // 0-100
  ctaPresence: number     // 0-100
  emojiUsage: number      // 0-100
  hashtagCount: number    // 0-100
  lengthScore: number     // 0-100
}

export interface QualityScore {
  engagement: EngagementScores
  overall: number         // 0-100 weighted composite
  suggestions: string[]
}

interface PlatformConfig {
  optimalLength: [number, number]
  optimalEmojis: [number, number]
  optimalHashtags: [number, number]
  weights: { hook: number; cta: number; length: number; emoji: number; hashtag: number }
}

const PLATFORM_CONFIG: Record<QualityPlatform, PlatformConfig> = {
  instagram: {
    optimalLength: [100, 200],
    optimalEmojis: [1, 5],
    optimalHashtags: [5, 15],
    weights: { hook: 0.25, cta: 0.20, length: 0.20, emoji: 0.15, hashtag: 0.20 },
  },
  twitter: {
    optimalLength: [71, 140],
    optimalEmojis: [0, 2],
    optimalHashtags: [1, 3],
    weights: { hook: 0.30, cta: 0.15, length: 0.25, emoji: 0.10, hashtag: 0.20 },
  },
  linkedin: {
    optimalLength: [150, 300],
    optimalEmojis: [0, 2],
    optimalHashtags: [3, 5],
    weights: { hook: 0.30, cta: 0.25, length: 0.20, emoji: 0.05, hashtag: 0.20 },
  },
  tiktok: {
    optimalLength: [50, 150],
    optimalEmojis: [2, 8],
    optimalHashtags: [3, 8],
    weights: { hook: 0.35, cta: 0.15, length: 0.15, emoji: 0.15, hashtag: 0.20 },
  },
  youtube: {
    optimalLength: [100, 500],
    optimalEmojis: [0, 3],
    optimalHashtags: [3, 8],
    weights: { hook: 0.30, cta: 0.25, length: 0.20, emoji: 0.05, hashtag: 0.20 },
  },
  facebook: {
    optimalLength: [80, 250],
    optimalEmojis: [0, 3],
    optimalHashtags: [1, 5],
    weights: { hook: 0.25, cta: 0.25, length: 0.25, emoji: 0.10, hashtag: 0.15 },
  },
  threads: {
    optimalLength: [50, 200],
    optimalEmojis: [0, 3],
    optimalHashtags: [1, 5],
    weights: { hook: 0.30, cta: 0.15, length: 0.25, emoji: 0.10, hashtag: 0.20 },
  },
}

/**
 * Score hook strength based on questions, numbers, and power words
 */
export function scoreHook(text: string): number {
  const lowerText = text.toLowerCase()
  let score = 0

  // Question-based hooks (start with question words)
  const questionStarts = /^(how|what|why|did you know|when|where|which|who)/i
  if (questionStarts.test(text.trim())) {
    score += 40
  }

  // Number-based hooks ("X ways", "top N", "5 tips")
  const numberPatterns = /(\d+\s+(ways|tips|secrets|reasons|methods|steps|hacks|tricks))|((top|best)\s+\d+)/i
  if (numberPatterns.test(text)) {
    score += 30
  }

  // Power words
  const powerWords = ['secret', 'proven', 'ultimate', 'essential', 'amazing', 'incredible', 'shocking', 'revealed', 'exclusive', 'breakthrough']
  const foundPowerWords = powerWords.filter(word => lowerText.includes(word))
  score += Math.min(foundPowerWords.length * 15, 30)

  return Math.min(score, 100)
}

/**
 * Score CTA presence
 */
export function scoreCta(text: string): number {
  const lowerText = text.toLowerCase()

  // Strong CTA keywords
  const strongCtaKeywords = ['link in bio', 'click the link', 'subscribe', 'follow me', 'dm me', 'swipe up']
  const hasStrongCta = strongCtaKeywords.some(keyword => lowerText.includes(keyword))
  if (hasStrongCta) {
    return 100
  }

  // Moderate CTA keywords
  const moderateCtaKeywords = ['share', 'comment below', 'save this', 'tag a friend', 'follow', 'click', 'check out']
  const hasModerateCta = moderateCtaKeywords.some(keyword => lowerText.includes(keyword))
  if (hasModerateCta) {
    return 70
  }

  // Weak CTA patterns (questions prompting engagement)
  const weakCtaPatterns = /what do you think|tell me|let me know|agree\?|thoughts\?/i
  if (weakCtaPatterns.test(text)) {
    return 40
  }

  return 0
}

/**
 * Score value within optimal range
 */
export function scoreRange(value: number, optimal: [number, number]): number {
  const [min, max] = optimal
  const rangeSize = max - min

  // Within range
  if (value >= min && value <= max) {
    return 100
  }

  // Below range
  if (value < min) {
    const distance = min - value
    const threshold = rangeSize * 0.5 // 50% at 0.5x the range
    if (distance >= threshold) {
      return 0
    }
    return Math.round(100 - (distance / threshold) * 100)
  }

  // Above range — symmetric with below
  const distance = value - max
  const threshold = rangeSize * 0.5
  if (distance >= threshold) {
    return 0
  }
  return Math.round(100 - (distance / threshold) * 100)
}

/**
 * Score content quality for a platform
 */
export function scoreContent(text: string, platform: QualityPlatform): QualityScore {
  const config = PLATFORM_CONFIG[platform]

  // Count metrics
  const emojiCount = (text.match(/\p{Emoji_Presentation}/gu) || []).length
  const hashtagCount = (text.match(/#\w+/g) || []).length
  const textLength = text.length

  // Score each dimension
  const hookStrength = scoreHook(text)
  const ctaPresence = scoreCta(text)
  const lengthScore = scoreRange(textLength, config.optimalLength)
  const emojiUsage = scoreRange(emojiCount, config.optimalEmojis)
  const hashtagScore = scoreRange(hashtagCount, config.optimalHashtags)

  // Weighted overall score
  const overall = Math.round(
    hookStrength * config.weights.hook +
    ctaPresence * config.weights.cta +
    lengthScore * config.weights.length +
    emojiUsage * config.weights.emoji +
    hashtagScore * config.weights.hashtag
  )

  // Generate suggestions for low-scoring dimensions
  const suggestions: string[] = []

  if (hookStrength < 40) {
    suggestions.push('Add a strong hook: start with a question, use numbers, or include power words like "secret" or "proven"')
  }

  if (ctaPresence < 40) {
    suggestions.push('Include a clear call-to-action: ask for comments, shares, or direct to "link in bio"')
  }

  if (lengthScore < 40) {
    const [min, max] = config.optimalLength
    if (textLength < min) {
      suggestions.push(`Content is too short for ${platform}. Aim for ${min}-${max} characters.`)
    } else {
      suggestions.push(`Content is too long for ${platform}. Aim for ${min}-${max} characters.`)
    }
  }

  if (emojiUsage < 40) {
    const [min, max] = config.optimalEmojis
    if (emojiCount < min && min > 0) {
      suggestions.push(`Add ${min}-${max} emojis to increase engagement on ${platform}`)
    } else if (emojiCount > max) {
      suggestions.push(`Reduce emojis to ${min}-${max} for better readability on ${platform}`)
    }
  }

  if (hashtagScore < 40) {
    const [min, max] = config.optimalHashtags
    if (hashtagCount < min) {
      suggestions.push(`Add ${min}-${max} relevant hashtags to improve discoverability on ${platform}`)
    } else {
      suggestions.push(`Reduce hashtags to ${min}-${max} to avoid looking spammy on ${platform}`)
    }
  }

  return {
    engagement: {
      hookStrength,
      ctaPresence,
      emojiUsage,
      hashtagCount: hashtagScore,
      lengthScore,
    },
    overall,
    suggestions,
  }
}
