/**
 * Image Filter Engine
 * Core engine for applying CSS filters and baking them to canvas
 */

import type { ImageFilters } from './image-adjustment-types'

/**
 * Build CSS filter string from filter values
 */
export function buildCssFilterString(filters: Partial<ImageFilters>): string {
  const parts: string[] = []

  if (filters.brightness !== undefined && filters.brightness !== 1) {
    parts.push(`brightness(${filters.brightness})`)
  }
  if (filters.contrast !== undefined && filters.contrast !== 1) {
    parts.push(`contrast(${filters.contrast})`)
  }
  if (filters.saturation !== undefined && filters.saturation !== 1) {
    parts.push(`saturate(${filters.saturation})`)
  }
  if (filters.hueRotate !== undefined && filters.hueRotate !== 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`)
  }
  if (filters.blur !== undefined && filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`)
  }

  // Temperature: sepia + saturate + hue-rotate combo
  if (filters.temperature !== undefined && filters.temperature !== 0) {
    const tempAbs = Math.abs(filters.temperature)
    const tempIntensity = tempAbs / 100
    if (filters.temperature > 0) {
      // Warm: add sepia tint
      parts.push(`sepia(${tempIntensity * 0.3})`)
      parts.push(`saturate(${1 + tempIntensity * 0.2})`)
    } else {
      // Cool: shift hue toward blue
      parts.push(`hue-rotate(${-tempIntensity * 20}deg)`)
      parts.push(`saturate(${1 + tempIntensity * 0.15})`)
    }
  }

  // Fade: reduce opacity
  if (filters.fade !== undefined && filters.fade > 0) {
    parts.push(`opacity(${1 - filters.fade})`)
  }

  return parts.join(' ')
}

/**
 * Detect Safari browser
 */
function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

/**
 * Bake filters to canvas element (async)
 */
export async function bakeFiltersToCanvas(
  img: HTMLImageElement,
  filters: Partial<ImageFilters>
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  const filterString = buildCssFilterString(filters)

  if (isSafari() && filterString) {
    // Safari fallback: render filtered img in temporary div, then draw to canvas
    const wrapper = document.createElement('div')
    wrapper.style.position = 'absolute'
    wrapper.style.left = '-9999px'
    wrapper.style.width = `${canvas.width}px`
    wrapper.style.height = `${canvas.height}px`

    const tempImg = document.createElement('img')
    tempImg.src = img.src
    tempImg.style.filter = filterString
    tempImg.style.width = '100%'
    tempImg.style.height = '100%'

    document.body.appendChild(wrapper)
    wrapper.appendChild(tempImg)

    await new Promise((resolve) => setTimeout(resolve, 100))

    ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height)
    document.body.removeChild(wrapper)
  } else {
    // Modern browsers: use ctx.filter
    ctx.filter = filterString || 'none'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }

  return canvas
}

/**
 * Merge two filter objects (overlay takes precedence)
 */
export function mergeFilters(
  base: Partial<ImageFilters>,
  overlay: Partial<ImageFilters>
): Partial<ImageFilters> {
  return { ...base, ...overlay }
}
