/** Crop geometry utilities for non-destructive image cropping */

export interface CropRegion {
  x: number
  y: number
  w: number
  h: number
}

export interface CropHandle {
  position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  cursor: string
  x: number
  y: number
}

/** Clamp crop region to shape bounds */
export function clampCrop(crop: CropRegion, shapeW: number, shapeH: number): CropRegion {
  const x = Math.max(0, Math.min(crop.x, shapeW - 1))
  const y = Math.max(0, Math.min(crop.y, shapeH - 1))
  const w = Math.max(1, Math.min(crop.w, shapeW - x))
  const h = Math.max(1, Math.min(crop.h, shapeH - y))
  return { x, y, w, h }
}

/** Constrain crop to aspect ratio */
export function constrainAspectRatio(
  crop: CropRegion,
  aspectRatio: number,
  shapeW: number,
  shapeH: number,
): CropRegion {
  let { w, h } = crop
  const currentRatio = w / h

  if (currentRatio > aspectRatio) {
    w = h * aspectRatio
  } else {
    h = w / aspectRatio
  }

  return clampCrop({ ...crop, w, h }, shapeW, shapeH)
}

/** Get 8 crop handles for resize interactions */
export function getCropHandles(crop: CropRegion): CropHandle[] {
  const { x, y, w, h } = crop
  const cx = x + w / 2
  const cy = y + h / 2

  return [
    { position: 'nw', cursor: 'nwse-resize', x, y },
    { position: 'n', cursor: 'ns-resize', x: cx, y },
    { position: 'ne', cursor: 'nesw-resize', x: x + w, y },
    { position: 'e', cursor: 'ew-resize', x: x + w, y: cy },
    { position: 'se', cursor: 'nwse-resize', x: x + w, y: y + h },
    { position: 's', cursor: 'ns-resize', x: cx, y: y + h },
    { position: 'sw', cursor: 'nesw-resize', x, y: y + h },
    { position: 'w', cursor: 'ew-resize', x, y: cy },
  ]
}

/** Update crop region by dragging a handle */
export function resizeCropByHandle(
  crop: CropRegion,
  handle: CropHandle['position'],
  dx: number,
  dy: number,
  shapeW: number,
  shapeH: number,
): CropRegion {
  let { x, y, w, h } = crop

  switch (handle) {
    case 'nw': x += dx; y += dy; w -= dx; h -= dy; break
    case 'n': y += dy; h -= dy; break
    case 'ne': w += dx; y += dy; h -= dy; break
    case 'e': w += dx; break
    case 'se': w += dx; h += dy; break
    case 's': h += dy; break
    case 'sw': x += dx; w -= dx; h += dy; break
    case 'w': x += dx; w -= dx; break
  }

  return clampCrop({ x, y, w, h }, shapeW, shapeH)
}

/** Generate CSS clip-path from crop region relative to shape dimensions */
export function cropToClipPath(crop: CropRegion, shapeW: number, shapeH: number): string {
  if (shapeW <= 0 || shapeH <= 0) return 'inset(0% 0% 0% 0%)'
  const left = (crop.x / shapeW) * 100
  const top = (crop.y / shapeH) * 100
  const right = ((shapeW - crop.x - crop.w) / shapeW) * 100
  const bottom = ((shapeH - crop.y - crop.h) / shapeH) * 100
  return `inset(${top}% ${right}% ${bottom}% ${left}%)`
}
