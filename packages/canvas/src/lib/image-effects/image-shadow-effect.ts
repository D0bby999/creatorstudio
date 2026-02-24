/**
 * Image Shadow Effect
 * Drop shadow effect for images
 */

import type { ShadowEffect } from '../image-filters/image-adjustment-types'

export const DEFAULT_SHADOW: ShadowEffect = {
  offsetX: 4,
  offsetY: 4,
  blur: 8,
  spread: 0,
  color: 'rgba(0, 0, 0, 0.3)',
}

/**
 * Build CSS box-shadow style from shadow effect
 */
export function buildImageShadowStyle(shadow: ShadowEffect): React.CSSProperties {
  const { offsetX, offsetY, blur, spread, color } = shadow
  return {
    boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`,
  }
}
