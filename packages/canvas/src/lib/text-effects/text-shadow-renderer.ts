import type { TextShadowEffect } from './text-effect-types'
import { DEFAULT_TEXT_SHADOW } from './text-effect-types'

export { DEFAULT_TEXT_SHADOW }

/**
 * Builds a CSS text-shadow value from a TextShadowEffect object
 * @param shadow - The shadow effect configuration
 * @returns CSS text-shadow string
 */
export function buildTextShadow(shadow: TextShadowEffect): string {
  return `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
}
