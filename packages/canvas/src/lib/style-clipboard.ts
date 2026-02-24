import type { Editor, TLShapeId } from 'tldraw'

export interface ShapeStyle {
  fill?: string
  stroke?: string
  fontFamily?: string
  fontWeight?: number
  fontSize?: number
  opacity?: number
}

let clipboardStyle: ShapeStyle | null = null

export function copyShapeStyle(
  editor: Editor,
  shapeId: TLShapeId
): ShapeStyle | null {
  const shape = editor.getShape(shapeId)
  if (!shape) return null

  const props = shape.props as Record<string, any>
  const style: ShapeStyle = {}

  if ('backgroundColor' in props) style.fill = props.backgroundColor
  if ('bgColor' in props) style.fill = props.bgColor
  if ('textColor' in props) style.stroke = props.textColor
  if ('fontFamily' in props) style.fontFamily = props.fontFamily
  if ('fontWeight' in props) style.fontWeight = props.fontWeight
  if ('fontSize' in props) style.fontSize = props.fontSize
  if ('opacity' in props) style.opacity = props.opacity

  clipboardStyle = style
  return style
}

export function pasteShapeStyle(
  editor: Editor,
  shapeIds: TLShapeId[],
  style: ShapeStyle
): number {
  let count = 0

  for (const id of shapeIds) {
    const shape = editor.getShape(id)
    if (!shape) continue

    const props = shape.props as Record<string, any>
    const updates: Record<string, any> = {}

    if (style.fill && ('backgroundColor' in props || 'bgColor' in props)) {
      if ('backgroundColor' in props) updates.backgroundColor = style.fill
      if ('bgColor' in props) updates.bgColor = style.fill
    }
    if (style.stroke && 'textColor' in props) updates.textColor = style.stroke
    if (style.fontFamily && 'fontFamily' in props) updates.fontFamily = style.fontFamily
    if (style.fontWeight && 'fontWeight' in props) updates.fontWeight = style.fontWeight
    if (style.fontSize && 'fontSize' in props) updates.fontSize = style.fontSize
    if (style.opacity !== undefined && 'opacity' in props) updates.opacity = style.opacity

    if (Object.keys(updates).length > 0) {
      editor.updateShapes([{ id, type: shape.type, props: updates }])
      count++
    }
  }

  return count
}

export function getClipboardStyle(): ShapeStyle | null {
  return clipboardStyle
}
