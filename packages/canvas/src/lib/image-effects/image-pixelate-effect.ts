/**
 * Image Pixelate Effect
 * Mosaic/pixel art effect for images
 */

/**
 * Apply pixelate effect to canvas (mutates canvas)
 * Downscales then upscales without smoothing
 */
export function applyPixelate(
  canvas: HTMLCanvasElement,
  blockSize: number
): HTMLCanvasElement {
  if (blockSize <= 1) return canvas

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  const { width, height } = canvas

  // Create small canvas
  const smallWidth = Math.ceil(width / blockSize)
  const smallHeight = Math.ceil(height / blockSize)
  const smallCanvas = document.createElement('canvas')
  smallCanvas.width = smallWidth
  smallCanvas.height = smallHeight
  const smallCtx = smallCanvas.getContext('2d')

  if (!smallCtx) throw new Error('Failed to get small canvas context')

  // Disable smoothing for blocky effect
  smallCtx.imageSmoothingEnabled = false
  ctx.imageSmoothingEnabled = false

  // Draw original to small canvas (downscale)
  smallCtx.drawImage(canvas, 0, 0, smallWidth, smallHeight)

  // Clear and redraw from small canvas (upscale)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(smallCanvas, 0, 0, smallWidth, smallHeight, 0, 0, width, height)

  return canvas
}

/**
 * Build CSS style for pixelate preview (non-destructive)
 */
export function buildPixelateCss(blockSize: number): React.CSSProperties {
  if (blockSize <= 1) return {}

  return {
    imageRendering: 'pixelated',
    transform: `scale(${1 / blockSize})`,
    transformOrigin: 'top left',
    width: `${blockSize * 100}%`,
    height: `${blockSize * 100}%`,
  }
}
