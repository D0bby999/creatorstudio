/**
 * Content performance prediction using heuristic analysis
 * Provides engagement score and actionable suggestions
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface PerformancePrediction {
  score: number
  factors: string[]
  suggestions: string[]
}

/**
 * Predict content performance using AI analysis
 * Returns score (0-100), positive/negative factors, and improvement suggestions
 */
export async function predictPerformance(
  content: string,
  platform: string
): Promise<PerformancePrediction> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const prompt = `Analyze this ${platform} post and predict its engagement performance.

Content: "${content}"

Evaluate these factors:
1. Content length (optimal for platform)
2. Hashtag usage and relevance
3. Emoji presence (moderate is good)
4. Question or engagement hook
5. Call-to-action presence
6. Visual appeal indicators
7. Authenticity and tone

Provide:
1. Overall engagement score (0-100)
2. List of positive factors (what works well)
3. List of negative factors (what could improve)
4. Actionable improvement suggestions

Format your response as JSON:
{
  "score": 85,
  "positiveFactors": ["Strong CTA", "Engaging question"],
  "negativeFactors": ["Too many hashtags"],
  "suggestions": ["Reduce hashtags to 5-7", "Add more personality"]
}`

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.5,
    })

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Combine positive and negative factors
    const allFactors = [
      ...(analysis.positiveFactors || []).map((f: string) => `✓ ${f}`),
      ...(analysis.negativeFactors || []).map((f: string) => `✗ ${f}`),
    ]

    return {
      score: Math.min(100, Math.max(0, analysis.score || 50)),
      factors: allFactors,
      suggestions: analysis.suggestions || [],
    }
  } catch (error) {
    console.error('Performance prediction error:', error)

    // Fallback to basic heuristic analysis
    return analyzeContentHeuristic(content, platform)
  }
}

/**
 * Fallback heuristic analysis when AI is unavailable
 */
function analyzeContentHeuristic(content: string, platform: string): PerformancePrediction {
  const factors: string[] = []
  const suggestions: string[] = []
  let score = 50

  // Content length analysis
  if (platform === 'twitter') {
    // Twitter uses character limit (280 max)
    const charCount = content.length
    const optimalCharCount = 280
    if (charCount > 0 && charCount <= optimalCharCount) {
      score += 10
      factors.push('✓ Good content length for Twitter')
    } else if (charCount > optimalCharCount) {
      factors.push('✗ Content exceeds Twitter character limit')
      suggestions.push(`Reduce content to ${optimalCharCount} characters for Twitter`)
    } else {
      factors.push('✗ Content too short')
      suggestions.push('Add more content for better engagement')
    }
  } else {
    // Other platforms use word count
    const wordCount = content.split(/\s+/).length
    const optimalLength = 150
    if (wordCount >= optimalLength * 0.5 && wordCount <= optimalLength * 1.5) {
      score += 10
      factors.push('✓ Good content length')
    } else {
      factors.push('✗ Content length could be optimized')
      suggestions.push(`Aim for ${optimalLength} words for ${platform}`)
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
