import type { Editor } from 'tldraw'

/** Proportionally reposition/resize child shapes when artboard dimensions change */
export function smartResize(
  editor: Editor,
  artboardId: string,
  newWidth: number,
  newHeight: number,
): void {
  const artboard = editor.getShape(artboardId as any)
  if (!artboard) return

  const artboardProps = artboard.props as Record<string, any>
  const oldW = artboardProps.w
  const oldH = artboardProps.h
  if (!oldW || !oldH || (oldW === newWidth && oldH === newHeight)) return

  const scaleX = newWidth / oldW
  const scaleY = newHeight / oldH
  const uniformScale = Math.min(scaleX, scaleY)

  const allShapes = editor.getCurrentPageShapes()
  const artX = artboard.x
  const artY = artboard.y

  // Find shapes that overlap with the artboard bounds
  const childShapes = allShapes.filter((s) => {
    if (s.id === artboard.id) return false
    const geo = editor.getShapeGeometry(s)
    const sx = s.x
    const sy = s.y
    const sw = geo.bounds.w
    const sh = geo.bounds.h
    return (
      sx + sw > artX && sx < artX + oldW &&
      sy + sh > artY && sy < artY + oldH
    )
  })

  // Resize artboard
  editor.updateShapes([{
    id: artboard.id,
    type: artboard.type,
    props: { w: newWidth, h: newHeight },
  } as any])

  // Scale child shapes
  const updates = childShapes.map((shape) => {
    const props = shape.props as Record<string, any>
    const relX = shape.x - artX
    const relY = shape.y - artY

    const update: any = {
      id: shape.id,
      type: shape.type,
      x: artX + relX * scaleX,
      y: artY + relY * scaleY,
      props: {},
    }

    if (typeof props.w === 'number') update.props.w = Math.round(props.w * uniformScale)
    if (typeof props.h === 'number') update.props.h = Math.round(props.h * uniformScale)
    if (typeof props.fontSize === 'number') update.props.fontSize = Math.round(props.fontSize * uniformScale)

    return update
  })

  if (updates.length > 0) editor.updateShapes(updates)
}
