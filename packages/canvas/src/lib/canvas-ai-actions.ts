import type { Editor } from 'tldraw'
import { autoLayout } from './canvas-smart-layout'
import { smartResize } from './canvas-smart-resize'

export interface AiActionResult {
  success: boolean
  error?: string
}

/** Generate an AI image and insert it on canvas */
export async function generateAiImage(
  editor: Editor,
  endpoint: string,
  prompt: string,
  options?: { width?: number; height?: number },
): Promise<AiActionResult> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, ...options }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { success: false, error: data.error ?? `Request failed (${res.status})` }
    }

    const { url } = await res.json()
    if (!url) return { success: false, error: 'No image URL returned' }

    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'image',
      x: center.x - 256,
      y: center.y - 256,
      props: { w: 512, h: 512, src: url },
    } as any)

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Unknown error' }
  }
}

/** Fill a shape's content with AI-generated text */
export async function fillShapeContent(
  editor: Editor,
  endpoint: string,
  shapeId: string,
  topic: string,
): Promise<AiActionResult> {
  const shape = editor.getShape(shapeId as any)
  if (!shape) return { success: false, error: 'Shape not found' }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shapeType: shape.type, topic }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { success: false, error: data.error ?? `Request failed (${res.status})` }
    }

    const { content } = await res.json()
    if (!content) return { success: false, error: 'No content returned' }

    editor.updateShapes([{
      id: shape.id,
      type: shape.type,
      props: content,
    } as any])

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Unknown error' }
  }
}

/** Apply auto-layout to all shapes on current page */
export function applyAutoLayout(editor: Editor): AiActionResult {
  try {
    autoLayout(editor)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/** Smart resize artboard + proportionally scale content */
export function applySmartResize(
  editor: Editor,
  artboardId: string,
  newWidth: number,
  newHeight: number,
): AiActionResult {
  try {
    smartResize(editor, artboardId, newWidth, newHeight)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
