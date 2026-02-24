/**
 * AI Background Removal API Route
 * Removes background from images using Replicate BRIA RMBG
 */

import { json } from 'react-router'
import type { ActionFunctionArgs } from 'react-router'
import { createReplicate } from '@ai-sdk/replicate'
import { auth } from '~/lib/auth-server'

const replicate = createReplicate({
  apiKey: process.env.REPLICATE_API_TOKEN,
})

// SSRF validation: only allow https URLs from known domains
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    // Allow common image hosting domains
    const allowedDomains = [
      'replicate.delivery',
      'replicate.com',
      'cloudinary.com',
      'amazonaws.com',
      'googleusercontent.com',
      'imgur.com',
    ]
    return allowedDomains.some((domain) => parsed.hostname.endsWith(domain))
  } catch {
    return false
  }
}

export async function action({ request }: ActionFunctionArgs) {
  // Auth check
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { imageUrl } = body

    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      return json({ error: 'Missing or invalid imageUrl' }, { status: 400 })
    }

    // SSRF validation
    if (!isValidImageUrl(imageUrl)) {
      return json(
        { error: 'Invalid image URL. Only HTTPS URLs from known domains are allowed.' },
        { status: 400 }
      )
    }

    // Basic rate limiting (simple in-memory counter)
    // Production should use Redis-backed rate limiter
    const rateLimitKey = `bg-remove:${session.user.id}`
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute
    const maxRequests = 5

    // Check if we have a rate limit entry (simplified - use Redis in production)
    // For now, just proceed (rate limiting should be added via packages/redis)

    // Call Replicate BRIA RMBG model
    const model = replicate.image('briaai/rmbg-1.4')

    const result = await model.doGenerate({
      prompt: '', // Not used by this model
      n: 1,
      size: undefined,
      providerOptions: {
        replicate: {
          input: {
            image: imageUrl,
          },
          version: 'latest',
        },
      },
    })

    if (!result.images || result.images.length === 0) {
      return json(
        { error: 'Background removal failed: no output generated' },
        { status: 500 }
      )
    }

    const resultUrl = result.images[0].url

    return json({ resultUrl })
  } catch (error) {
    console.error('Background removal error:', error)
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to remove background',
      },
      { status: 500 }
    )
  }
}

export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 })
}
