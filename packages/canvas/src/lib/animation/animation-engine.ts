/**
 * Animation Engine
 * CSS keyframe generation and preview playback
 */

import type { AnimationEffect, AnimationPhase, ShapeAnimation } from './animation-types'

/**
 * Generate CSS keyframes for an animation effect
 */
export function generateKeyframes(effect: AnimationEffect, phase: AnimationPhase): string {
  const isEntrance = phase === 'entrance'
  const name = `anim-${effect}-${phase}`

  switch (effect) {
    case 'fade':
      return isEntrance
        ? `@keyframes ${name} { from { opacity: 0; } to { opacity: 1; } }`
        : `@keyframes ${name} { from { opacity: 1; } to { opacity: 0; } }`

    case 'slide-left':
      return isEntrance
        ? `@keyframes ${name} { from { transform: translateX(100%); } to { transform: translateX(0); } }`
        : `@keyframes ${name} { from { transform: translateX(0); } to { transform: translateX(-100%); } }`

    case 'slide-right':
      return isEntrance
        ? `@keyframes ${name} { from { transform: translateX(-100%); } to { transform: translateX(0); } }`
        : `@keyframes ${name} { from { transform: translateX(0); } to { transform: translateX(100%); } }`

    case 'slide-up':
      return isEntrance
        ? `@keyframes ${name} { from { transform: translateY(100%); } to { transform: translateY(0); } }`
        : `@keyframes ${name} { from { transform: translateY(0); } to { transform: translateY(-100%); } }`

    case 'slide-down':
      return isEntrance
        ? `@keyframes ${name} { from { transform: translateY(-100%); } to { transform: translateY(0); } }`
        : `@keyframes ${name} { from { transform: translateY(0); } to { transform: translateY(100%); } }`

    case 'bounce':
      return isEntrance
        ? `@keyframes ${name} {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }`
        : `@keyframes ${name} {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); }
            100% { transform: scale(0); opacity: 0; }
          }`

    case 'zoom':
      return isEntrance
        ? `@keyframes ${name} { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }`
        : `@keyframes ${name} { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 0; } }`

    case 'spin':
      return isEntrance
        ? `@keyframes ${name} { from { transform: rotate(-360deg) scale(0); opacity: 0; } to { transform: rotate(0) scale(1); opacity: 1; } }`
        : `@keyframes ${name} { from { transform: rotate(0) scale(1); opacity: 1; } to { transform: rotate(360deg) scale(0); opacity: 0; } }`

    case 'typewriter':
      // Typewriter only works for text, simplified to fade for now
      return isEntrance
        ? `@keyframes ${name} { from { opacity: 0; } to { opacity: 1; } }`
        : `@keyframes ${name} { from { opacity: 1; } to { opacity: 0; } }`

    default:
      return `@keyframes ${name} { from { opacity: 0; } to { opacity: 1; } }`
  }
}

/**
 * Build CSS animation shorthand
 */
export function buildAnimationCss(animation: ShapeAnimation): string {
  const name = `anim-${animation.effect}-${animation.phase}`
  const { duration, easing, delay } = animation
  return `${name} ${duration}s ${easing} ${delay}s forwards`
}

/**
 * Get animation name for an effect
 */
export function getAnimationName(effect: AnimationEffect, phase: AnimationPhase): string {
  return `anim-${effect}-${phase}`
}

let previewStyleElement: HTMLStyleElement | null = null
let previewTimeout: NodeJS.Timeout | null = null

/**
 * Preview animations on current page
 * Creates temporary styles and applies animation classes
 */
export function previewPageAnimations(
  editor: any, // Editor type
  animations: Array<{ shapeId: string; animation: ShapeAnimation }>,
): void {
  // Stop any existing preview
  stopPreview()

  // Generate all keyframes
  const keyframes = new Set<string>()
  for (const { animation } of animations) {
    keyframes.add(generateKeyframes(animation.effect, animation.phase))
  }

  // Create style element
  previewStyleElement = document.createElement('style')
  previewStyleElement.textContent = Array.from(keyframes).join('\n')
  document.head.appendChild(previewStyleElement)

  // Find max duration to auto-cleanup
  let maxDuration = 0
  for (const { animation } of animations) {
    const totalTime = animation.delay + animation.duration
    if (totalTime > maxDuration) maxDuration = totalTime
  }

  // Apply animations to shape elements (this is a simplified approach)
  // In practice, we'd need to find the DOM elements for each shape
  // For now, just set a cleanup timeout
  previewTimeout = setTimeout(() => {
    stopPreview()
  }, maxDuration * 1000 + 100)
}

/**
 * Stop preview and cleanup
 */
export function stopPreview(): void {
  if (previewStyleElement) {
    previewStyleElement.remove()
    previewStyleElement = null
  }
  if (previewTimeout) {
    clearTimeout(previewTimeout)
    previewTimeout = null
  }
}
