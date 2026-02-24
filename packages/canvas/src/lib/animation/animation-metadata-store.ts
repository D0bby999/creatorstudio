/**
 * Animation Metadata Store
 * Read/write animation data from shape.meta and page.meta
 */

import type { Editor, TLShapeId, TLPageId } from 'tldraw'
import type { ShapeAnimation } from './animation-types'
import type { PageTransition } from './page-transition-types'

const ANIMATION_META_KEY = 'animation'
const TRANSITION_META_KEY = 'transition'

/**
 * Get animation for a shape
 */
export function getShapeAnimation(editor: Editor, shapeId: TLShapeId): ShapeAnimation | null {
  const shape = editor.getShape(shapeId)
  if (!shape) return null

  const meta = shape.meta as any
  if (!meta || !meta[ANIMATION_META_KEY]) return null

  return meta[ANIMATION_META_KEY] as ShapeAnimation
}

/**
 * Set animation for a shape
 */
export function setShapeAnimation(
  editor: Editor,
  shapeId: TLShapeId,
  animation: ShapeAnimation,
): void {
  const shape = editor.getShape(shapeId)
  if (!shape) return

  editor.updateShape({
    id: shapeId,
    type: shape.type,
    meta: {
      ...shape.meta,
      [ANIMATION_META_KEY]: animation as any, // JsonObject compat
    },
  })
}

/**
 * Remove animation from a shape
 */
export function removeShapeAnimation(editor: Editor, shapeId: TLShapeId): void {
  const shape = editor.getShape(shapeId)
  if (!shape) return

  const meta = { ...shape.meta } as any
  delete meta[ANIMATION_META_KEY]

  editor.updateShape({
    id: shapeId,
    type: shape.type,
    meta,
  })
}

/**
 * Get all animated shapes on current page
 */
export function getAnimatedShapes(editor: Editor): Array<{ shapeId: TLShapeId; animation: ShapeAnimation }> {
  const shapes = editor.getCurrentPageShapes()
  const animated: Array<{ shapeId: TLShapeId; animation: ShapeAnimation }> = []

  for (const shape of shapes) {
    const anim = getShapeAnimation(editor, shape.id)
    if (anim) {
      animated.push({ shapeId: shape.id, animation: anim })
    }
  }

  return animated
}

/**
 * Get page transition
 */
export function getPageTransition(editor: Editor, pageId: TLPageId): PageTransition | null {
  const page = editor.getPage(pageId)
  if (!page) return null

  const meta = page.meta as any
  if (!meta || !meta[TRANSITION_META_KEY]) return null

  return meta[TRANSITION_META_KEY] as PageTransition
}

/**
 * Set page transition
 */
export function setPageTransition(
  editor: Editor,
  pageId: TLPageId,
  transition: PageTransition,
): void {
  const page = editor.getPage(pageId)
  if (!page) return

  editor.updatePage({
    id: pageId,
    meta: {
      ...page.meta,
      [TRANSITION_META_KEY]: transition as any, // JsonObject compat
    },
  })
}

/**
 * Remove page transition
 */
export function removePageTransition(editor: Editor, pageId: TLPageId): void {
  const page = editor.getPage(pageId)
  if (!page) return

  const meta = { ...page.meta } as any
  delete meta[TRANSITION_META_KEY]

  editor.updatePage({
    id: pageId,
    meta,
  })
}
