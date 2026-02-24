import type { ActionFunctionArgs } from 'react-router'
import { auth } from '~/lib/auth-server'

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

// In-memory rate limiter (per userId)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 }
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - userLimit.count }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ message: 'Method not allowed' }, { status: 405 })
  }

  // Auth check
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Check if API key is configured
  const apiKey = process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) {
    return Response.json(
      { message: 'Unsplash API not configured. Please set UNSPLASH_ACCESS_KEY environment variable.' },
      { status: 503 }
    )
  }

  // Rate limit check
  const userId = session.user.id
  const rateLimit = checkRateLimit(userId)
  if (!rateLimit.allowed) {
    return Response.json(
      { message: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
  }

  // Parse request body
  let body: { query: string; page?: number; perPage?: number }
  try {
    body = await request.json()
  } catch (e) {
    return Response.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { query, page = 1, perPage = 20 } = body

  if (!query || typeof query !== 'string') {
    return Response.json({ message: 'Query parameter is required' }, { status: 400 })
  }

  // Forward to Unsplash API
  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('page', String(page))
    url.searchParams.set('per_page', String(perPage))

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${apiKey}`,
        'Accept-Version': 'v1',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Unsplash API error:', errorText)
      return Response.json({ message: 'Failed to fetch photos from Unsplash' }, { status: response.status })
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Unsplash proxy error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
