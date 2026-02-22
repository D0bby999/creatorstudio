import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { handleAiStream } from '@creator-studio/ai/lib/ai-stream-handler'
import { getSessions, getSession } from '@creator-studio/ai/lib/session-memory'
import { sanitizeUserInput, wrapWithDelimiters } from '@creator-studio/ai/lib/prompt-sanitizer'
import { checkAiRateLimit, AiRateLimitError } from '@creator-studio/ai/lib/ai-rate-limiter'
import { auth } from '~/lib/auth.server'
import { logger } from '~/lib/logger'
import type { AgentRole } from '@creator-studio/ai/types/ai-types'

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { sessionId, message, agentRole } = body

  if (!sessionId || !message || !agentRole) {
    return Response.json(
      { error: 'Missing required fields: sessionId, message, or agentRole' },
      { status: 400 }
    )
  }

  try {
    const userId = session.user.id

    // Rate limit check
    try {
      await checkAiRateLimit(userId)
    } catch (e) {
      if (e instanceof AiRateLimitError) {
        return Response.json(
          { error: 'Rate limit exceeded', retryAfter: e.retryAfter },
          { status: 429, headers: { 'Retry-After': String(e.retryAfter) } }
        )
      }
    }

    // Sanitize user message
    const { sanitized, flags } = sanitizeUserInput(message)
    if (flags.some(f => f.severity === 'high')) {
      logger.warn({ flags, userId }, 'Prompt injection attempt detected')
    }

    // Wrap sanitized input with delimiters for context isolation
    const { wrapped } = wrapWithDelimiters(sanitized)

    const result = await handleAiStream(sessionId, wrapped, agentRole as AgentRole, {
      abortSignal: request.signal,
    })
    return result.toTextStreamResponse()
  } catch (error) {
    // Check if error is due to missing API key
    const errorMessage = String(error)
    if (errorMessage.includes('API key') || errorMessage.includes('OPENAI_API_KEY')) {
      return Response.json(
        {
          error: 'OPENAI_API_KEY not configured. Set it in your environment variables to enable AI features.'
        },
        { status: 503 }
      )
    }

    // Generic error
    logger.error({ err: error }, 'AI service error')
    return Response.json(
      { error: 'AI service error. Please try again.' },
      { status: 500 }
    )
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('sessionId')

  if (sessionId) {
    const session = await getSession(sessionId)
    return Response.json({ session })
  }

  const sessions = await getSessions()
  return Response.json({ sessions })
}
