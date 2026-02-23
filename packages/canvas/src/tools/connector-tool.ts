import { StateNode, type TLEventHandlers, type TLShapeId, createShapeId } from 'tldraw'
import { findShapeAtPoint, snapToShapeEdge } from '../lib/connector-anchor-utils'
import { createBinding } from '../shapes/connector-binding'

class Idle extends StateNode {
  static override id = 'idle'

  override onPointerDown: TLEventHandlers['onPointerDown'] = () => {
    this.parent.transition('pointing')
  }

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }
}

class Pointing extends StateNode {
  static override id = 'pointing'

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    if (this.editor.inputs.isDragging) {
      this.parent.transition('dragging')
    }
  }

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    this.parent.transition('idle')
  }

  override onCancel: TLEventHandlers['onCancel'] = () => {
    this.parent.transition('idle')
  }
}

class Dragging extends StateNode {
  static override id = 'dragging'

  private shapeId: TLShapeId | null = null
  private startShapeId: TLShapeId | null = null

  override onEnter = () => {
    const { originPagePoint } = this.editor.inputs
    const startTarget = findShapeAtPoint(
      this.editor,
      { x: originPagePoint.x, y: originPagePoint.y },
    )
    this.startShapeId = startTarget

    const id = createShapeId()
    this.shapeId = id

    this.editor.createShape({
      id,
      type: 'connector' as any,
      x: originPagePoint.x,
      y: originPagePoint.y,
      props: {
        w: 1, h: 1,
        startX: 0, startY: 0,
        endX: 0, endY: 0,
        style: 'solid',
        stroke: '#333333',
        strokeWidth: 2,
        showArrow: true,
      },
    })
  }

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    if (!this.shapeId) return
    const { currentPagePoint, originPagePoint } = this.editor.inputs

    const dx = currentPagePoint.x - originPagePoint.x
    const dy = currentPagePoint.y - originPagePoint.y
    const minX = Math.min(0, dx)
    const minY = Math.min(0, dy)
    const w = Math.abs(dx) || 1
    const h = Math.abs(dy) || 1

    this.editor.updateShape({
      id: this.shapeId,
      type: 'connector' as any,
      x: originPagePoint.x + minX,
      y: originPagePoint.y + minY,
      props: {
        w, h,
        startX: dx >= 0 ? 0 : w,
        startY: dy >= 0 ? 0 : h,
        endX: dx >= 0 ? w : 0,
        endY: dy >= 0 ? h : 0,
      },
    })
  }

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    if (!this.shapeId) {
      this.parent.transition('idle')
      return
    }

    const { currentPagePoint, originPagePoint } = this.editor.inputs
    const endTarget = findShapeAtPoint(
      this.editor,
      { x: currentPagePoint.x, y: currentPagePoint.y },
      this.shapeId ? [this.shapeId] : [],
    )

    // Create bindings for start/end if snapped to shapes
    if (this.startShapeId) {
      const anchor = snapToShapeEdge(this.editor, this.startShapeId, {
        x: originPagePoint.x, y: originPagePoint.y,
      })
      if (anchor) {
        createBinding(this.editor, {
          connectorId: this.shapeId,
          targetId: this.startShapeId,
          terminal: 'start',
          normalizedAnchor: anchor,
        })
      }
    }

    if (endTarget) {
      const anchor = snapToShapeEdge(this.editor, endTarget, {
        x: currentPagePoint.x, y: currentPagePoint.y,
      })
      if (anchor) {
        createBinding(this.editor, {
          connectorId: this.shapeId,
          targetId: endTarget,
          terminal: 'end',
          normalizedAnchor: anchor,
        })
      }
    }

    this.editor.select(this.shapeId)
    this.shapeId = null
    this.startShapeId = null
    this.parent.transition('idle')
  }

  override onCancel: TLEventHandlers['onCancel'] = () => {
    if (this.shapeId) {
      this.editor.deleteShapes([this.shapeId])
    }
    this.shapeId = null
    this.startShapeId = null
    this.parent.transition('idle')
  }
}

export class ConnectorTool extends StateNode {
  static override id = 'connector'
  static override initial = 'idle'
  static override children = () => [Idle, Pointing, Dragging]
}
