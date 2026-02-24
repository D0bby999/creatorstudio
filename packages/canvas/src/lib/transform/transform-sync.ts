import type { Editor, TLShapeId } from 'tldraw'

export interface ShapeTransform {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

/**
 * Get transform data for a shape (position, size, rotation).
 * Uses getShapePageBounds for page-space position and shape props for rotation.
 */
export function getShapeTransform(editor: Editor, shapeId: TLShapeId): ShapeTransform | null {
  const shape = editor.getShape(shapeId)
  if (!shape) return null

  const bounds = editor.getShapePageBounds(shapeId)
  if (!bounds) return null

  const rotation = shape.rotation ?? 0

  return {
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    w: Math.round(bounds.w),
    h: Math.round(bounds.h),
    rotation: Math.round((rotation * 180) / Math.PI), // radians to degrees
  }
}

/**
 * Update shape transform. Partial updates allowed.
 * Position updates use editor.updateShape with x/y props.
 * Size updates use editor.resizeShape for proper aspect handling.
 * Rotation updates use editor.rotateShapesBy.
 */
export function setShapeTransform(
  editor: Editor,
  shapeId: TLShapeId,
  partial: Partial<ShapeTransform>,
): void {
  const shape = editor.getShape(shapeId)
  if (!shape) return

  // Update rotation first (if provided)
  if (partial.rotation !== undefined) {
    const currentRotation = shape.rotation ?? 0
    const targetRotation = (partial.rotation * Math.PI) / 180 // degrees to radians
    const delta = targetRotation - currentRotation
    editor.rotateShapesBy([shapeId], delta)
  }

  // Update position (if provided)
  if (partial.x !== undefined || partial.y !== undefined) {
    const bounds = editor.getShapePageBounds(shapeId)
    if (bounds) {
      const newX = partial.x ?? bounds.x
      const newY = partial.y ?? bounds.y
      const deltaX = newX - bounds.x
      const deltaY = newY - bounds.y
      editor.nudgeShapes([shapeId], { x: deltaX, y: deltaY })
    }
  }

  // Update size (if provided)
  if (partial.w !== undefined || partial.h !== undefined) {
    const bounds = editor.getShapePageBounds(shapeId)
    if (bounds) {
      const newW = partial.w ?? bounds.w
      const newH = partial.h ?? bounds.h
      editor.resizeShape(shapeId, { x: newW, y: newH })
    }
  }
}

/**
 * Flip shapes horizontally or vertically.
 * Wraps editor.flipShapes with direction normalization.
 */
export function flipShape(
  editor: Editor,
  shapeIds: TLShapeId[],
  direction: 'horizontal' | 'vertical',
): void {
  if (shapeIds.length === 0) return
  editor.flipShapes(shapeIds, direction === 'horizontal' ? 'horizontal' : 'vertical')
}

/**
 * Calculate locked aspect ratio dimension.
 * When aspect lock is on, changing one dimension calculates the other proportionally.
 */
export function lockAspect(
  currentW: number,
  currentH: number,
  changedDim: 'w' | 'h',
  newValue: number,
): { w: number; h: number } {
  if (currentW === 0 || currentH === 0) return { w: currentW, h: currentH }

  const aspectRatio = currentW / currentH

  if (changedDim === 'w') {
    return { w: newValue, h: Math.round(newValue / aspectRatio) }
  } else {
    return { w: Math.round(newValue * aspectRatio), h: newValue }
  }
}
