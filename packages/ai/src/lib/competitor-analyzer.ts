/**
 * Competitor analysis using AI structured output + heuristic fallback
 */

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { resolveModelForTask } from './model-resolver'

// Schema
export const CompetitorInsightsSchema = z.object({
  contentThemes: z.array(z.string()),
  toneAnalysis: z.string(),
  postingFrequency: z.string(),
  engagementPatterns: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
})
export type CompetitorInsights = z.infer<typeof CompetitorInsightsSchema>

export const ALLOWED_COMPETITOR_DOMAINS = [
  'instagram.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'facebook.com',
  'tiktok.com',
  'youtube.com',
  'threads.net',
] as const

/**
 * Analyze competitor content using AI structured output
 * Falls back to minimal insights when AI is unavailable
 */
export async function analyzeCompetitor(
  url: string,
  scrapedContent?: string
): Promise<CompetitorInsights> {
  // Validate URL against allowlist
  validateCompetitorUrl(url)

  // Require scraped content
  if (!scrapedContent) {
    throw new Error('Scraped content is required. Use crawler to fetch competitor page content first.')
  }

  try {
    const { output } = await generateText({
      model: resolveModelForTask('competitor-analysis'),
      output: Output.object({ schema: CompetitorInsightsSchema }),
      prompt: `Analyze this competitor's social media presence and provide strategic insights.

URL: ${url}
Content: ${scrapedContent.slice(0, 10000)} ${scrapedContent.length > 10000 ? '(truncated)' : ''}

Provide:
- contentThemes: Main topics and themes they focus on (3-5 items)
- toneAnalysis: Description of their communication tone and style
- postingFrequency: Estimated posting cadence (daily, 2-3x/week, etc.)
- engagementPatterns: Observable patterns in their engagement strategy (3-5 items)
- strengths: What they do well (3-5 items)
- weaknesses: Areas where they could improve (3-5 items)
- opportunities: Strategic opportunities you could leverage (3-5 items)`,
      temperature: 0.4,
    })

    return output!
  } catch (error) {
    console.error('Competitor analysis error:', error)
    return analyzeCompetitorHeuristic()
  }
}

/**
 * Validate URL is from an allowed competitor domain
 */
function validateCompetitorUrl(url: string): void {
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()

    const isAllowed = ALLOWED_COMPETITOR_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      throw new Error(
        `URL domain not allowed. Supported platforms: ${ALLOWED_COMPETITOR_DOMAINS.join(', ')}`
      )
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Invalid URL format')
    }
    throw error
  }
}

/**
 * Fallback heuristic analysis when AI is unavailable
 */
function analyzeCompetitorHeuristic(): CompetitorInsights {
  return {
    contentThemes: [],
    toneAnalysis: 'Analysis unavailable',
    postingFrequency: 'Unable to determine',
    engagementPatterns: [],
    strengths: [],
    weaknesses: [],
    opportunities: [],
  }
}
