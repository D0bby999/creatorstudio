import type { TextOutlineEffect } from './text-effect-types'
import { DEFAULT_TEXT_OUTLINE } from './text-effect-types'

export { DEFAULT_TEXT_OUTLINE }

/**
 * Builds CSS style properties for text outline effect
 * @param outline - The outline effect configuration
 * @returns React.CSSProperties object with webkit-text-stroke
 */
export function buildTextOutlineStyle(outline: TextOutlineEffect): React.CSSProperties {
  return {
    WebkitTextStroke: `${outline.width}px ${outline.color}`,
    paintOrder: 'stroke fill',
  }
}
