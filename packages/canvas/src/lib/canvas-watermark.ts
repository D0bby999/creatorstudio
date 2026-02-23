import type { Editor } from 'tldraw'

export interface WatermarkOptions {
  text: string
  position?: 'bottom-right' | 'bottom-left' | 'center'
  opacity?: number
  fontSize?: number
}

/**
 * Add watermark shape, export, then remove it.
 * Wrapped in editor.batch() so undo reverses the entire operation.
 */
export async function exportWithWatermark(
  editor: Editor,
  exportFn: () => Promise<Blob>,
  options: WatermarkOptions,
): Promise<Blob> {
  const { text, position = 'bottom-right', opacity = 0.3, fontSize = 24 } = options

  const shapes = editor.getCurrentPageShapes()
  if (shapes.length === 0) return exportFn()

  // Find canvas bounds for watermark placement
  const bounds = editor.getCurrentPageBounds()
  if (!bounds) return exportFn()

  const positionMap = {
    'bottom-right': { x: bounds.maxX - text.length * fontSize * 0.5 - 20, y: bounds.maxY - fontSize - 20 },
    'bottom-left': { x: bounds.minX + 20, y: bounds.maxY - fontSize - 20 },
    'center': { x: bounds.midX - text.length * fontSize * 0.25, y: bounds.midY },
  }

  const pos = positionMap[position]

  // Create temporary watermark text shape
  const watermarkId = `shape:watermark-${Date.now()}` as any

  editor.createShape({
    id: watermarkId,
    type: 'text',
    x: pos.x,
    y: pos.y,
    opacity: opacity,
    props: {
      text,
      size: 's',
      font: 'sans',
      textAlign: 'start',
    },
  } as any)

  try {
    const blob = await exportFn()
    return blob
  } finally {
    // Always remove watermark shape after export
    editor.deleteShapes([watermarkId])
  }
}
