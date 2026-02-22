/**
 * AI Image Generation API endpoint
 * POST: Generate image from text prompt
 */

import type { ActionFunctionArgs } from 'react-router'
import { generateImage } from '@creator-studio/ai/lib/image-generation'
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
    const { prompt, width, height } = body

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Invalid prompt' }, { status: 400 })
    }

    // Sanitize prompt (limit length, strip HTML)
    const sanitizedPrompt = prompt
      .replace(/<[^>]*>/g, '')
      .slice(0, 1000)
      .trim()

    if (!sanitizedPrompt) {
      return Response.json({ error: 'Prompt cannot be empty' }, { status: 400 })
    }

    // Validate dimensions to prevent resource exhaustion
    const MIN_DIM = 256
    const MAX_DIM = 2048
    const MAX_ASPECT = 4

    const parsedWidth = Math.floor(Number(width || 1024))
    const parsedHeight = Math.floor(Number(height || 1024))

    if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight)) {
      return Response.json({ error: 'Invalid width or height' }, { status: 400 })
    }

    const clampedWidth = Math.max(MIN_DIM, Math.min(parsedWidth, MAX_DIM))
    const clampedHeight = Math.max(MIN_DIM, Math.min(parsedHeight, MAX_DIM))

    const aspect = clampedWidth / clampedHeight
    if (aspect > MAX_ASPECT || aspect < 1 / MAX_ASPECT) {
      return Response.json(
        { error: `Aspect ratio must be between 1:${MAX_ASPECT} and ${MAX_ASPECT}:1` },
        { status: 400 }
      )
    }

    // Generate image
    const result = await generateImage(sanitizedPrompt, {
      width: clampedWidth,
      height: clampedHeight,
    })

    return Response.json({
      success: true,
      imageUrl: result.url,
      id: result.id,
    })
  } catch (error) {
    logger.error({ err: error }, 'Image generation error')

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for missing API token
    if (errorMessage.includes('REPLICATE_API_TOKEN')) {
      return Response.json(
        { error: 'Image generation service not configured' },
        { status: 503 }
      )
    }

    return Response.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
