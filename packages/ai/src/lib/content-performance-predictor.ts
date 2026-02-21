/**
 * Content performance prediction using AI structured output + heuristic fallback
 */

import { generateObject } from 'ai'
import { resolveModelForTask } from './model-resolver'
import { PerformancePredictionSchema } from '../types/ai-types'
import type { PerformancePrediction } from '../types/ai-types'

/**
 * Predict content performance using AI structured output
 * Falls back to heuristic analysis when AI is unavailable
 */
export async function predictPerformance(
  content: string,
  platform: string,
  brandContext?: string
): Promise<PerformancePrediction> {
  try {
    const { object } = await generateObject({
      model: resolveModelForTask('prediction'),
      schema: PerformancePredictionSchema,
      prompt: `${brandContext ? `${brandContext}\n\n` : ''}Analyze this ${platform} post and predict its engagement performance.

Content: "${content}"

Evaluate: content length, hashtag usage, emoji presence, engagement hooks, CTA, visual appeal, tone.
Provide a score 0-100, positive factors, negative factors, and actionable suggestions.`,
      temperature: 0.5,
    })

    // Map structured output to unified factors format
    const factors = [
      ...object.positiveFactors.map((f: string) => `✓ ${f}`),
      ...object.negativeFactors.map((f: string) => `✗ ${f}`),
    ]

    return {
      score: Math.min(100, Math.max(0, object.score)),
      factors,
      suggestions: object.suggestions,
    }
  } catch (error) {
    console.error('Performance prediction error:', error)
    return analyzeContentHeuristic(content, platform)
  }
}

/**
 * Fallback heuristic analysis when AI is unavailable
 */
export function analyzeContentHeuristic(content: string, platform: string): PerformancePrediction {
  const factors: string[] = []
  const suggestions: string[] = []
  let score = 50

  // Content length analysis
  if (platform === 'twitter') {
    const charCount = content.length
    if (charCount > 0 && charCount <= 280) {
      score += 10
      factors.push('✓ Good content length for Twitter')
    } else if (charCount > 280) {
      factors.push('✗ Content exceeds Twitter character limit')
      suggestions.push('Reduce content to 280 characters for Twitter')
    } else {
      factors.push('✗ Content too short')
      suggestions.push('Add more content for better engagement')
    }
  } else {
    const wordCount = content.split(/\s+/).length
    if (wordCount >= 75 && wordCount <= 225) {
      score += 10
      factors.push('✓ Good content length')
    } else {
      factors.push('✗ Content length could be optimized')
      suggestions.push(`Aim for 150 words for ${platform}`)
    }
  }

  // Hashtag presence
  const hashtagCount = (content.match(/#\w+/g) || []).length
  if (hashtagCount > 0 && hashtagCount <= 10) {
    score += 10
    factors.push('✓ Good hashtag usage')
  } else if (hashtagCount === 0) {
    factors.push('✗ No hashtags found')
    suggestions.push('Add relevant hashtags to increase discoverability')
  } else {
    factors.push('✗ Too many hashtags')
    suggestions.push('Reduce hashtags to 5-10 for better readability')
  }

  // Emoji analysis
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length
  if (emojiCount > 0 && emojiCount <= 5) {
    score += 10
    factors.push('✓ Good emoji usage')
  } else if (emojiCount === 0) {
    suggestions.push('Add 1-2 emojis to make content more engaging')
  }

  // Question presence
  if (content.includes('?')) {
    score += 10
    factors.push('✓ Engaging question included')
  } else {
    suggestions.push('Consider adding a question to encourage engagement')
  }

  // CTA presence
  const ctaKeywords = ['click', 'link', 'comment', 'share', 'follow', 'subscribe', 'visit', 'check out', 'learn more']
  if (ctaKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
    score += 10
    factors.push('✓ Clear call-to-action')
  } else {
    suggestions.push('Add a call-to-action to drive engagement')
  }

  return {
    score: Math.min(100, score),
    factors,
    suggestions,
  }
}
