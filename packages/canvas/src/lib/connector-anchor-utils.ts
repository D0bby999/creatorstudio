import type { Editor, TLShapeId } from 'tldraw'

export interface AnchorPoint {
  x: number
  y: number
}

export interface NormalizedAnchor {
  x: number
  y: number
}

/** Convert normalized anchor (0-1) to absolute page coordinates for a shape */
export function anchorToPagePoint(
  editor: Editor,
  shapeId: TLShapeId,
  anchor: NormalizedAnchor,
): AnchorPoint | null {
  const bounds = editor.getShapePageBounds(shapeId)
  if (!bounds) return null
  return {
    x: bounds.x + bounds.w * anchor.x,
    y: bounds.y + bounds.h * anchor.y,
  }
}

/** Convert absolute page coordinates to normalized anchor (0-1) for a shape */
export function pagePointToAnchor(
  editor: Editor,
  shapeId: TLShapeId,
  point: AnchorPoint,
): NormalizedAnchor | null {
  const bounds = editor.getShapePageBounds(shapeId)
  if (!bounds) return null
  return {
    x: bounds.w > 0 ? (point.x - bounds.x) / bounds.w : 0.5,
    y: bounds.h > 0 ? (point.y - bounds.y) / bounds.h : 0.5,
  }
}

/** Find the closest edge anchor point on a shape to a given page point */
export function snapToShapeEdge(
  editor: Editor,
  shapeId: TLShapeId,
  point: AnchorPoint,
): NormalizedAnchor | null {
  const bounds = editor.getShapePageBounds(shapeId)
  if (!bounds) return null

  const edges: NormalizedAnchor[] = [
    { x: 0.5, y: 0 },   // top center
    { x: 1, y: 0.5 },   // right center
    { x: 0.5, y: 1 },   // bottom center
    { x: 0, y: 0.5 },   // left center
    { x: 0.5, y: 0.5 }, // center
  ]

  let closest = edges[0]
  let minDist = Infinity

  for (const edge of edges) {
    const edgeX = bounds.x + bounds.w * edge.x
    const edgeY = bounds.y + bounds.h * edge.y
    const dist = Math.hypot(point.x - edgeX, point.y - edgeY)
    if (dist < minDist) {
      minDist = dist
      closest = edge
    }
  }

  return closest
}

/** Check if a page point is within snap distance of a shape */
export function isPointNearShape(
  editor: Editor,
  shapeId: TLShapeId,
  point: AnchorPoint,
  threshold: number = 20,
): boolean {
  const bounds = editor.getShapePageBounds(shapeId)
  if (!bounds) return false

  const expandedMinX = bounds.x - threshold
  const expandedMinY = bounds.y - threshold
  const expandedMaxX = bounds.x + bounds.w + threshold
  const expandedMaxY = bounds.y + bounds.h + threshold

  return (
    point.x >= expandedMinX &&
    point.x <= expandedMaxX &&
    point.y >= expandedMinY &&
    point.y <= expandedMaxY
  )
}

/** Find shape under point (for snapping during connector drawing) */
export function findShapeAtPoint(
  editor: Editor,
  point: AnchorPoint,
  excludeIds: TLShapeId[] = [],
): TLShapeId | null {
  const shapes = editor.getCurrentPageShapes()
  const excludeSet = new Set(excludeIds)

  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]
    if (excludeSet.has(shape.id)) continue
    if (isPointNearShape(editor, shape.id, point)) {
      return shape.id
    }
  }
  return null
}
