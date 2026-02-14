/**
 * AI Image Generation API endpoint
 * POST: Generate image from text prompt
 */

import type { ActionFunctionArgs } from 'react-router'
import { generateImage } from '@creator-studio/ai/lib/image-generation'
import { auth } from '~/lib/auth.server'

export async function action({ request }: ActionFunctionArgs) {
  // Check authentication
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
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

    // Generate image
    const result = await generateImage(sanitizedPrompt, {
      width: width || 1024,
      height: height || 1024,
    })

    return Response.json({
      success: true,
      imageUrl: result.url,
      id: result.id,
    })
  } catch (error) {
    console.error('Image generation error:', error)

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
