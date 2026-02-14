/**
 * AI-powered hashtag generation for social media platforms
 * Uses OpenAI to generate platform-specific hashtags
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface PlatformRules {
  maxHashtags: number
  recommended: number
  style: string
}

const PLATFORM_RULES: Record<string, PlatformRules> = {
  instagram: {
    maxHashtags: 30,
    recommended: 12,
    style: 'Mix of trending, niche, and broad hashtags. Include community tags.',
  },
  twitter: {
    maxHashtags: 5,
    recommended: 3,
    style: 'Concise, trending hashtags only. Avoid hashtag spam.',
  },
  tiktok: {
    maxHashtags: 8,
    recommended: 5,
    style: 'Trending challenges, sounds, and viral topics. Include #FYP.',
  },
  linkedin: {
    maxHashtags: 5,
    recommended: 3,
    style: 'Professional, industry-specific hashtags. Avoid casual tags.',
  },
}

/**
 * Generate AI-powered hashtag suggestions for content
 */
export async function suggestHashtags(
  content: string,
  platform: string,
  count?: number
): Promise<string[]> {
  const rules = PLATFORM_RULES[platform.toLowerCase()] || PLATFORM_RULES.instagram
  const targetCount = count || rules.recommended

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const prompt = `Generate ${targetCount} hashtags for this ${platform} post.

Content: "${content}"

Platform rules:
- Maximum allowed: ${rules.maxHashtags}
- Recommended count: ${rules.recommended}
- Style: ${rules.style}

Requirements:
- Return ONLY the hashtags, one per line
- DO NOT include the # symbol
- Use alphanumeric characters only (no spaces, symbols)
- Mix of trending, niche, and broad topics
- Relevant to the content theme

Example format:
CreatorEconomy
ContentCreation
SocialMediaTips`

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.7,
    })

    // Parse hashtags from response
    const hashtags = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(tag => tag.replace(/^#/, '')) // Remove # if present
      .filter(tag => /^[a-zA-Z0-9]+$/.test(tag)) // Only alphanumeric
      .slice(0, targetCount)

    return hashtags
  } catch (error) {
    console.error('Hashtag generation error:', error)
    throw new Error('Failed to generate hashtags')
  }
}
