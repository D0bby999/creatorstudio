/**
 * Image crop tool — non-destructive cropping via CSS clip-path.
 * Stores crop data in shape props. Works with any image-containing shape.
 */
import { StateNode, type TLEventHandlers, type TLShapeId } from 'tldraw'
import {
  type CropRegion,
  type CropHandle,
  resizeCropByHandle,
  clampCrop,
} from '../lib/canvas-crop-utils'

class Idle extends StateNode {
  static override id = 'idle'

  override onPointerDown: TLEventHandlers['onPointerDown'] = () => {
    const selected = this.editor.getSelectedShapes()
    if (selected.length === 1) {
      const shape = selected[0]
      const props = shape.props as Record<string, any>
      // Initialize crop if not present
      if (!props.crop) {
        this.editor.updateShape({
          id: shape.id,
          type: shape.type,
          props: { crop: { x: 0, y: 0, w: props.w ?? 100, h: props.h ?? 100 } },
        } as any)
      }
      this.parent.transition('pointing')
    }
  }

  override onEnter = () => {
    this.editor.setCursor({ type: 'default', rotation: 0 })
  }
}

class PointingCrop extends StateNode {
  static override id = 'pointing'

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    if (this.editor.inputs.isDragging) {
      this.parent.transition('cropping')
    }
  }

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    this.parent.transition('idle')
  }

  override onCancel: TLEventHandlers['onCancel'] = () => {
    this.parent.transition('idle')
  }
}

class Cropping extends StateNode {
  static override id = 'cropping'

  private targetId: TLShapeId | null = null
  private handle: CropHandle['position'] = 'se'
  private initialCrop: CropRegion | null = null

  override onEnter = () => {
    const selected = this.editor.getSelectedShapes()
    if (selected.length !== 1) {
      this.parent.transition('idle')
      return
    }
    this.targetId = selected[0].id
    const props = selected[0].props as Record<string, any>
    this.initialCrop = props.crop ?? { x: 0, y: 0, w: props.w ?? 100, h: props.h ?? 100 }
    // Default to SE handle (drag to resize from bottom-right)
    this.handle = 'se'
  }

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    if (!this.targetId || !this.initialCrop) return

    const shape = this.editor.getShape(this.targetId)
    if (!shape) return

    const props = shape.props as Record<string, any>
    const shapeW = props.w ?? 100
    const shapeH = props.h ?? 100

    const { originPagePoint, currentPagePoint } = this.editor.inputs
    const dx = currentPagePoint.x - originPagePoint.x
    const dy = currentPagePoint.y - originPagePoint.y

    const newCrop = resizeCropByHandle(this.initialCrop, this.handle, dx, dy, shapeW, shapeH)

    this.editor.updateShape({
      id: this.targetId,
      type: shape.type,
      props: { crop: newCrop },
    } as any)
  }

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    this.targetId = null
    this.initialCrop = null
    this.parent.transition('idle')
  }

  override onCancel: TLEventHandlers['onCancel'] = () => {
    // Restore initial crop on cancel
    if (this.targetId && this.initialCrop) {
      const shape = this.editor.getShape(this.targetId)
      if (shape) {
        this.editor.updateShape({
          id: this.targetId,
          type: shape.type,
          props: { crop: this.initialCrop },
        } as any)
      }
    }
    this.targetId = null
    this.initialCrop = null
    this.parent.transition('idle')
  }
}

export class CropTool extends StateNode {
  static override id = 'crop'
  static override initial = 'idle'
  static override children = () => [Idle, PointingCrop, Cropping]
}
