/**
 * Maps AI-generated design layouts to tldraw shapes
 * Converts JSON layout elements into editor.createShape() calls
 */

import { createShapeId, type Editor } from 'tldraw'

interface DesignLayoutElement {
  type: 'rectangle' | 'text' | 'ellipse' | 'image-placeholder' | 'line'
  x: number
  y: number
  w: number
  h: number
  content?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  textAlign?: 'start' | 'middle' | 'end'
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  opacity?: number
  cornerRadius?: number
  rotation?: number
  zIndex?: number
}

interface DesignLayout {
  title: string
  width: number
  height: number
  backgroundColor?: string
  elements: DesignLayoutElement[]
}

const TLDRAW_COLORS = [
  'black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue',
  'yellow', 'orange', 'green', 'light-green', 'light-red', 'red',
] as const

function mapColorToTldraw(hex?: string): string {
  if (!hex) return 'black'
  const map: Record<string, string> = {
    '#000': 'black', '#333': 'black', '#666': 'grey', '#999': 'grey',
    '#f00': 'red', '#0f0': 'green', '#00f': 'blue',
    '#ff0': 'yellow', '#f90': 'orange', '#90f': 'violet',
  }
  const lower = hex.toLowerCase()
  if (map[lower]) return map[lower]

  // Heuristic: parse hex to determine closest named color
  const r = parseInt(lower.slice(1, 3), 16) || 0
  const g = parseInt(lower.slice(3, 5), 16) || 0
  const b = parseInt(lower.slice(5, 7), 16) || 0

  if (r > 200 && g < 100 && b < 100) return 'red'
  if (r < 100 && g > 200 && b < 100) return 'green'
  if (r < 100 && g < 100 && b > 200) return 'blue'
  if (r > 200 && g > 200 && b < 100) return 'yellow'
  if (r > 200 && g > 100 && b < 100) return 'orange'
  if (r > 100 && g < 100 && b > 200) return 'violet'
  if (r > 200 && g > 200 && b > 200) return 'grey'
  return 'black'
}

function mapTextSize(fontSize?: number): 's' | 'm' | 'l' | 'xl' {
  if (!fontSize || fontSize <= 16) return 's'
  if (fontSize <= 24) return 'm'
  if (fontSize <= 36) return 'l'
  return 'xl'
}

export function mapLayoutToShapes(
  editor: Editor,
  layout: DesignLayout,
  sessionId?: string,
): string[] {
  const shapeIds: string[] = []
  const sorted = [...layout.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  const meta = { aiGenerated: true, designSessionId: sessionId ?? '' }

  // Optional background rectangle
  if (layout.backgroundColor) {
    const bgId = createShapeId()
    editor.createShape({
      id: bgId,
      type: 'geo',
      x: 0,
      y: 0,
      props: {
        geo: 'rectangle',
        w: layout.width,
        h: layout.height,
        color: mapColorToTldraw(layout.backgroundColor),
        fill: 'solid',
      },
      meta,
    } as any)
    shapeIds.push(bgId)
  }

  for (const el of sorted) {
    try {
      const baseProps = { x: el.x, y: el.y, meta }

      const id = createShapeId()

      switch (el.type) {
        case 'rectangle': {
          editor.createShape({
            id,
            type: 'geo',
            ...baseProps,
            props: {
              geo: 'rectangle',
              w: el.w,
              h: el.h,
              color: mapColorToTldraw(el.backgroundColor),
              fill: el.backgroundColor ? 'solid' : 'none',
            },
          } as any)
          shapeIds.push(id)
          break
        }
        case 'text': {
          editor.createShape({
            id,
            type: 'text',
            ...baseProps,
            props: {
              text: el.content ?? '',
              size: mapTextSize(el.fontSize),
              font: 'sans',
              textAlign: el.textAlign ?? 'start',
              w: el.w,
            },
          } as any)
          shapeIds.push(id)
          break
        }
        case 'ellipse': {
          editor.createShape({
            id,
            type: 'geo',
            ...baseProps,
            props: {
              geo: 'ellipse',
              w: el.w,
              h: el.h,
              color: mapColorToTldraw(el.backgroundColor),
              fill: el.backgroundColor ? 'solid' : 'none',
            },
          } as any)
          shapeIds.push(id)
          break
        }
        case 'image-placeholder': {
          editor.createShape({
            id,
            type: 'geo',
            ...baseProps,
            props: {
              geo: 'rectangle',
              w: el.w,
              h: el.h,
              dash: 'dashed',
              color: 'grey',
              fill: 'none',
            },
          } as any)
          shapeIds.push(id)
          // Add placeholder label
          const labelId = createShapeId()
          editor.createShape({
            id: labelId,
            type: 'text',
            x: el.x + el.w / 2 - 40,
            y: el.y + el.h / 2 - 10,
            props: {
              text: el.content ?? 'Image',
              size: 's',
              font: 'sans',
              color: 'grey',
            },
            meta,
          } as any)
          shapeIds.push(labelId)
          break
        }
        case 'line': {
          editor.createShape({
            id,
            type: 'geo',
            ...baseProps,
            props: {
              geo: 'rectangle',
              w: el.w,
              h: Math.max(el.h, 2),
              color: mapColorToTldraw(el.backgroundColor),
              fill: 'solid',
            },
          } as any)
          shapeIds.push(id)
          break
        }
      }
    } catch (err) {
      console.warn('[design-mapper] Failed to create shape:', el.type, err)
    }
  }

  return shapeIds
}

export function clearAiGeneratedShapes(editor: Editor, sessionId: string): void {
  const allShapes = editor.getCurrentPageShapes()
  const toDelete = allShapes
    .filter((s: any) => s.meta?.aiGenerated && s.meta?.designSessionId === sessionId)
    .map(s => s.id)

  if (toDelete.length > 0) {
    editor.deleteShapes(toDelete)
  }
}
