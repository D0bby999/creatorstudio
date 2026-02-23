import type { Editor, TLShape } from 'tldraw'

export interface LayoutSuggestion {
  shapeId: string
  x: number
  y: number
}

/** Analyze shapes and suggest centered, evenly-spaced layout */
export function suggestLayout(editor: Editor): LayoutSuggestion[] {
  const shapes = editor.getCurrentPageShapes()
  if (shapes.length < 2) return []

  const bounds = shapes.map((s) => {
    const geo = editor.getShapeGeometry(s)
    return { id: s.id, x: s.x, y: s.y, w: geo.bounds.w, h: geo.bounds.h }
  })

  // Calculate center of mass
  const totalW = bounds.reduce((s, b) => s + b.w, 0)
  const avgX = bounds.reduce((s, b) => s + b.x + b.w / 2, 0) / bounds.length
  const centerX = avgX

  // Sort by current Y position
  const sorted = [...bounds].sort((a, b) => a.y - b.y)

  // Equal vertical spacing: 20px gap
  const gap = 20
  let currentY = sorted[0].y

  return sorted.map((b) => {
    const suggestion: LayoutSuggestion = {
      shapeId: b.id as string,
      x: centerX - b.w / 2,
      y: currentY,
    }
    currentY += b.h + gap
    return suggestion
  })
}

/** Apply layout suggestions to shapes */
export function applyLayout(editor: Editor, suggestions: LayoutSuggestion[]): void {
  if (suggestions.length === 0) return
  const updates = suggestions.map((s) => {
    const shape = editor.getShape(s.shapeId as any)
    if (!shape) return null
    return { id: shape.id, type: shape.type, x: s.x, y: s.y }
  }).filter(Boolean)
  if (updates.length > 0) editor.updateShapes(updates as any)
}

/** One-click auto layout */
export function autoLayout(editor: Editor): void {
  const suggestions = suggestLayout(editor)
  applyLayout(editor, suggestions)
}
