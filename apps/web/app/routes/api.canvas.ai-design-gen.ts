/**
 * POST /api/canvas/ai-design-gen
 * Generate or refine AI design layouts via structured LLM output
 */

import { auth } from '~/lib/auth-server'
import { generateDesignLayout, refineDesignLayout } from '@creator-studio/ai/lib/design-layout-generator'
import { DESIGN_TEMPLATE_PRESETS, DesignLayoutSchema } from '@creator-studio/ai/lib/design-layout-schema'
import { sanitizeUserInput } from '@creator-studio/ai/lib/prompt-sanitizer'

const MAX_PROMPT_LENGTH = 1000
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  let body: {
    prompt?: string
    presetId?: string
    sessionId?: string
    refinement?: boolean
    currentLayout?: any
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate sessionId format if provided
  if (body.sessionId && !UUID_REGEX.test(body.sessionId)) {
    return Response.json({ error: 'Invalid sessionId' }, { status: 400 })
  }

  // Validate presetId if provided
  if (body.presetId && !DESIGN_TEMPLATE_PRESETS.some(p => p.id === body.presetId)) {
    return Response.json({ error: 'Invalid presetId' }, { status: 400 })
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

  try {
    if (body.refinement && body.sessionId && body.currentLayout) {
      // Validate currentLayout against schema before passing to LLM
      const parsed = DesignLayoutSchema.safeParse(body.currentLayout)
      if (!parsed.success) {
        return Response.json({ error: 'Invalid layout data' }, { status: 400 })
      }

      const result = await refineDesignLayout(
        body.sessionId,
        prompt,
        parsed.data,
      )
      return Response.json({ sessionId: body.sessionId, layout: result.layout })
    }

    const result = await generateDesignLayout(prompt, body.presetId, body.sessionId)
    return Response.json({ sessionId: result.sessionId, layout: result.layout })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    console.error('[ai-design-gen] Error:', message)

    if (message.includes('Maximum refinement')) {
      return Response.json({ error: message }, { status: 400 })
    }
    return Response.json({ error: 'Design generation failed' }, { status: 500 })
  }
}
