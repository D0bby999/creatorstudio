/**
 * Image Duotone Effect
 * Two-color gradient mapping for images
 */

/**
 * Apply duotone effect to canvas (mutates canvas)
 * Converts to grayscale then applies gradient map from dark to light
 */
export function applyDuotone(
  canvas: HTMLCanvasElement,
  darkColor: string,
  lightColor: string
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Parse colors
  const dark = parseColor(darkColor)
  const light = parseColor(lightColor)

  // Convert to grayscale and apply gradient map
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const t = gray / 255

    data[i] = dark.r + (light.r - dark.r) * t
    data[i + 1] = dark.g + (light.g - dark.g) * t
    data[i + 2] = dark.b + (light.b - dark.b) * t
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Build CSS overlay for duotone preview (non-destructive)
 */
export function buildDuotoneCssOverlay(
  darkColor: string,
  lightColor: string
): React.CSSProperties {
  return {
    position: 'relative',
    filter: 'grayscale(1)',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: `linear-gradient(to bottom right, ${darkColor}, ${lightColor})`,
      mixBlendMode: 'multiply',
      pointerEvents: 'none',
    },
  } as React.CSSProperties
}

/**
 * Parse hex/rgb/rgba color to RGB object
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return { r: 0, g: 0, b: 0 }

  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const data = ctx.getImageData(0, 0, 1, 1).data

  return { r: data[0], g: data[1], b: data[2] }
}
