import type { TextGlowEffect } from './text-effect-types'
import { DEFAULT_TEXT_GLOW } from './text-effect-types'

export { DEFAULT_TEXT_GLOW }

/**
 * Builds a CSS text-shadow value that creates a luminous glow effect
 * Uses multiple layered shadows with increasing blur for halo effect
 * @param glow - The glow effect configuration
 * @returns CSS text-shadow string with multiple shadow layers
 */
export function buildTextGlow(glow: TextGlowEffect): string {
  const layers: string[] = []
  const baseBlur = glow.intensity * 2

  // Create 5 layered shadows for smooth glow
  for (let i = 1; i <= 5; i++) {
    const blur = baseBlur * i * (glow.spread / 3)
    layers.push(`0 0 ${blur}px ${glow.color}`)
  }

  return layers.join(', ')
}
