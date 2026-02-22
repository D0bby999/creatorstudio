import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { handleAiStream } from '@creator-studio/ai/lib/ai-stream-handler'
import { getSessions, getSession } from '@creator-studio/ai/lib/session-memory'
import { logger } from '~/lib/logger'
import type { AgentRole } from '@creator-studio/ai/types/ai-types'

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json()
  const { sessionId, message, agentRole } = body

  if (!sessionId || !message || !agentRole) {
    return Response.json(
      { error: 'Missing required fields: sessionId, message, or agentRole' },
      { status: 400 }
    )
  }

  try {
    const result = await handleAiStream(sessionId, message, agentRole as AgentRole, {
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
