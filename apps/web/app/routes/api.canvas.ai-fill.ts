import type { ActionFunctionArgs } from 'react-router'
import { requireSession } from '~/lib/auth-server'
import { logger } from '~/lib/logger'

const SHAPE_PROMPTS: Record<string, (topic: string, style?: string) => string> = {
  'quote-card': (topic, style) =>
    `Generate an inspiring ${style ?? 'motivational'} quote about "${topic}". Return JSON: { "quoteText": "...", "author": "..." }`,
  'carousel-slide': (topic) =>
    `Generate content for a carousel slide about "${topic}". Return JSON: { "title": "...", "body": "..." }`,
  'text-overlay': (topic) =>
    `Generate a short, punchy caption about "${topic}" (max 10 words). Return JSON: { "text": "..." }`,
  'social-card': (topic) =>
    `Generate social media post content about "${topic}". Return JSON: { "title": "...", "body": "...", "ctaText": "..." }`,
}

export async function action({ request }: ActionFunctionArgs) {
  await requireSession(request)

  try {
    const { shapeType, topic, style } = await request.json()

    if (!shapeType || !topic) {
      return Response.json({ error: 'shapeType and topic required' }, { status: 400 })
    }

    const promptFn = SHAPE_PROMPTS[shapeType]
    if (!promptFn) {
      return Response.json({ error: `Unsupported shape type: ${shapeType}` }, { status: 400 })
    }

    let generateText: any
    try {
      const ai = await import('@creator-studio/ai')
      generateText = ai.generateText
    } catch {
      return Response.json({ error: 'AI features not available' }, { status: 503 })
    }

    const prompt = promptFn(topic, style)
    const result = await generateText(prompt)

    // Extract JSON from response
    const text = typeof result === 'string' ? result : result?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const content = JSON.parse(jsonMatch[0])
    return Response.json({ content })
  } catch (error: any) {
    if (error?.status === 429) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    logger.error({ err: error }, 'Canvas AI fill error')
    return Response.json({ error: 'Content generation failed' }, { status: 500 })
  }
}
