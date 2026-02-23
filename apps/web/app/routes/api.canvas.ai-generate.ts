import type { ActionFunctionArgs } from 'react-router'
import { requireSession } from '~/lib/auth-server'
import { logger } from '~/lib/logger'

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request)

  try {
    const { prompt, width = 1024, height = 1024 } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (prompt.length > 1000) {
      return Response.json({ error: 'Prompt too long (max 1000 chars)' }, { status: 400 })
    }

    let generateImage: any
    let sanitizeInput: any
    let uploadFile: any
    let generateMediaPath: any
    let getPublicUrl: any

    try {
      const ai = await import('@creator-studio/ai')
      generateImage = ai.generateImage
      sanitizeInput = ai.sanitizeInput
    } catch {
      return Response.json({ error: 'AI features not available' }, { status: 503 })
    }

    try {
      const storage = await import('@creator-studio/storage')
      uploadFile = storage.uploadFile
      generateMediaPath = storage.generateMediaPath
      getPublicUrl = storage.getPublicUrl
    } catch {
      return Response.json({ error: 'Storage not configured' }, { status: 503 })
    }

    const sanitized = sanitizeInput ? sanitizeInput(prompt) : prompt
    const result = await generateImage(sanitized, { width, height })

    if (!result?.image) {
      return Response.json({ error: 'Image generation failed' }, { status: 500 })
    }

    const buffer = Buffer.from(result.image, 'base64')
    const key = generateMediaPath(session.user.id, 'canvas-asset', `ai-${Date.now()}.png`)
    await uploadFile(key, buffer, 'image/png')
    const url = getPublicUrl(key)

    return Response.json({ url, key })
  } catch (error: any) {
    if (error?.status === 429) {
      return Response.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }
    logger.error({ err: error }, 'Canvas AI generate error')
    return Response.json({ error: 'Generation failed' }, { status: 500 })
  }
}
