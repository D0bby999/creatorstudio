/**
 * AI Suggestions API endpoint
 * POST: Get hashtags, scheduling, or performance predictions
 */

import type { ActionFunctionArgs } from 'react-router'
import { suggestHashtags } from '@creator-studio/ai/lib/hashtag-suggestions'
import { suggestPostingTimes } from '@creator-studio/ai/lib/content-scheduling'
import { predictPerformance } from '@creator-studio/ai/lib/content-performance-predictor'
import { checkAiRateLimit, AiRateLimitError } from '@creator-studio/ai/lib/ai-rate-limiter'
import { auth } from '~/lib/auth.server'
import { logger } from '~/lib/logger'

export async function action({ request }: ActionFunctionArgs) {
  // Check authentication
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  // Rate limit check
  try {
    await checkAiRateLimit(session.user.id)
  } catch (e) {
    if (e instanceof AiRateLimitError) {
      return Response.json(
        { error: 'Rate limit exceeded', retryAfter: e.retryAfter },
        { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
      )
    }
  }

  try {
    const body = await request.json()
    const { type, content, platform, count, timezone } = body

    if (!type) {
      return Response.json({ error: 'Missing type parameter' }, { status: 400 })
    }

    switch (type) {
      case 'hashtags': {
        if (!content || !platform) {
          return Response.json({ error: 'Missing content or platform' }, { status: 400 })
        }

        const hashtags = await suggestHashtags(content, platform, count)

        return Response.json({
          success: true,
          type: 'hashtags',
          hashtags,
          formatted: hashtags.map(tag => `#${tag}`).join(' '),
        })
      }

      case 'scheduling': {
        if (!platform) {
          return Response.json({ error: 'Missing platform' }, { status: 400 })
        }

        const times = await suggestPostingTimes(platform, timezone)

        return Response.json({
          success: true,
          type: 'scheduling',
          suggestions: times,
          platform,
        })
      }

      case 'performance': {
        if (!content || !platform) {
          return Response.json({ error: 'Missing content or platform' }, { status: 400 })
        }

        const prediction = await predictPerformance(content, platform)

        return Response.json({
          success: true,
          type: 'performance',
          score: prediction.score,
          factors: prediction.factors,
          suggestions: prediction.suggestions,
        })
      }

      default:
        return Response.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    logger.error({ err: error }, 'AI suggestions error')

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for missing API key
    if (errorMessage.includes('OPENAI_API_KEY')) {
      return Response.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    return Response.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
