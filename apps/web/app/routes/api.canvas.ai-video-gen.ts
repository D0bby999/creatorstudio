/**
 * POST /api/canvas/ai-video-gen
 * Validates auth, checks monthly quota, enqueues Inngest video gen job
 */

import { auth } from '~/lib/auth-server'
import { inngest } from '~/lib/inngest/inngest-client'
import { cacheGet, cacheSet } from '@creator-studio/redis'
import { sanitizeUserInput } from '@creator-studio/ai/lib/prompt-sanitizer'

const PRO_TIER_LIMIT = 5
const MAX_PROMPT_LENGTH = 500
const VALID_RATIOS = new Set(['16:9', '9:16', '1:1'])

function getQuotaKey(userId: string): string {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return `canvas:video:quota:${userId}:${month}`
}

function stripControlChars(str: string): string {
  return str.replace(/[\x00-\x1F\x7F]/g, '').trim()
}

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { prompt?: string; aspectRatio?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rawPrompt = stripControlChars(body.prompt ?? '')
  if (!rawPrompt || rawPrompt.length > MAX_PROMPT_LENGTH) {
    return Response.json({ error: `Prompt required (max ${MAX_PROMPT_LENGTH} chars)` }, { status: 400 })
  }

  const sanitized = sanitizeUserInput(rawPrompt)
  if (!sanitized.safe) {
    return Response.json({ error: 'Prompt contains disallowed content' }, { status: 400 })
  }
  const prompt = sanitized.sanitized

  const aspectRatio = body.aspectRatio ?? '16:9'
  if (!VALID_RATIOS.has(aspectRatio)) {
    return Response.json({ error: 'Invalid aspect ratio' }, { status: 400 })
  }

  // Check monthly quota
  const quotaKey = getQuotaKey(session.user.id)
  const currentStr = await cacheGet<string>(quotaKey)
  const current = currentStr ? parseInt(currentStr, 10) : 0
  const limit = PRO_TIER_LIMIT // TODO: check user tier

  if (current >= limit) {
    return Response.json({
      error: 'Monthly video generation limit reached',
      quota: { used: current, limit },
    }, { status: 429 })
  }

  const jobId = crypto.randomUUID()

  try {
    await inngest.send({
      name: 'canvas/video.generate',
      data: {
        jobId,
        userId: session.user.id,
        prompt,
        aspectRatio,
      },
    })

    // Increment quota counter with TTL to end of month
    const daysLeft = daysUntilEndOfMonth()
    await cacheSet(quotaKey, String(current + 1), daysLeft * 86400)

    return Response.json({
      jobId,
      quota: { used: current + 1, limit },
    })
  } catch (err) {
    console.error('[ai-video-gen] Failed to enqueue job:', err)
    return Response.json({ error: 'Failed to start video generation' }, { status: 500 })
  }
}

function daysUntilEndOfMonth(): number {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.max(1, lastDay - now.getDate() + 1)
}
