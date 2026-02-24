/**
 * AI design layout generator
 * Uses Claude via structured output to generate editable canvas layouts
 */

import { generateText, Output } from 'ai'
import { resolveModelForTask } from './model-resolver'
import { DesignLayoutSchema, DESIGN_TEMPLATE_PRESETS, type DesignLayout, type DesignTemplatePreset } from './design-layout-schema'
import { buildDesignPrompt, buildRefinementPrompt } from './design-layout-prompts'
import { cacheGet, cacheSet } from '@creator-studio/redis'

const SESSION_PREFIX = 'ai:session:design:'
const SESSION_TTL = 3600
const MAX_TURNS = 5

interface DesignSession {
  sessionId: string
  turnCount: number
  lastLayout: DesignLayout | null
}

async function loadSession(sessionId: string): Promise<DesignSession | null> {
  const raw = await cacheGet<string>(`${SESSION_PREFIX}${sessionId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function saveSession(session: DesignSession): Promise<void> {
  await cacheSet(
    `${SESSION_PREFIX}${session.sessionId}`,
    JSON.stringify(session),
    SESSION_TTL
  )
}

export async function generateDesignLayout(
  prompt: string,
  presetId?: string,
  sessionId?: string,
): Promise<{ layout: DesignLayout; sessionId: string }> {
  const preset = presetId
    ? DESIGN_TEMPLATE_PRESETS.find(p => p.id === presetId) ?? null
    : null

  const fullPrompt = buildDesignPrompt(prompt, preset)

  const { output } = await generateText({
    model: resolveModelForTask('design-layout'),
    output: Output.object({ schema: DesignLayoutSchema }),
    prompt: fullPrompt,
  })

  if (!output) {
    throw new Error('Failed to generate design layout')
  }

  const layout = clampLayout(output, preset)
  const sid = sessionId ?? crypto.randomUUID()

  await saveSession({ sessionId: sid, turnCount: 1, lastLayout: layout })

  return { layout, sessionId: sid }
}

export async function refineDesignLayout(
  sessionId: string,
  instruction: string,
  currentLayout: DesignLayout,
): Promise<{ layout: DesignLayout }> {
  const session = await loadSession(sessionId)
  if (session && session.turnCount >= MAX_TURNS) {
    throw new Error('Maximum refinement turns reached (5)')
  }

  const fullPrompt = buildRefinementPrompt(instruction, currentLayout)

  const { output } = await generateText({
    model: resolveModelForTask('design-layout'),
    output: Output.object({ schema: DesignLayoutSchema }),
    prompt: fullPrompt,
  })

  if (!output) {
    throw new Error('Failed to refine design layout')
  }

  const layout = clampLayout(output, null)
  const turnCount = session ? session.turnCount + 1 : 1

  await saveSession({ sessionId, turnCount, lastLayout: layout })

  return { layout }
}

/** Clamp element positions to stay within canvas bounds */
function clampLayout(layout: DesignLayout, preset: DesignTemplatePreset | null): DesignLayout {
  const w = preset?.width ?? layout.width
  const h = preset?.height ?? layout.height

  return {
    ...layout,
    width: w,
    height: h,
    elements: layout.elements.map(el => ({
      ...el,
      x: Math.max(0, Math.min(el.x, w - el.w)),
      y: Math.max(0, Math.min(el.y, h - el.h)),
      w: Math.min(el.w, w),
      h: Math.min(el.h, h),
    })),
  }
}
