/**
 * GIF Export Client
 * Client-side GIF encoding using gifenc (if available)
 */

import type { Editor } from 'tldraw'

export interface GifExportOptions {
  fps?: number
  width?: number
  duration?: number
  quality?: number
  onProgress?: (progress: number) => void
}

/**
 * Export canvas to GIF
 * Note: gifenc must be installed separately
 * This is a stub implementation that gracefully degrades if gifenc is not available
 */
export async function exportToGif(
  editor: Editor,
  options: GifExportOptions = {},
): Promise<Blob> {
  const {
    fps = 24,
    width = 720,
    duration = 5,
    quality = 10,
    onProgress,
  } = options

  try {
    // Try to dynamically import gifenc
    // @ts-expect-error - gifenc is optional dependency
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc')

    const totalFrames = Math.floor(duration * fps)
    const frameDelay = 1000 / fps

    // Create GIF encoder
    const gif = GIFEncoder()

    // Capture frames
    for (let i = 0; i < totalFrames; i++) {
      // Capture frame using tldraw's export API
      const shapeIds = Array.from(editor.getCurrentPageShapeIds())
      const result = await editor.toImage(shapeIds, {
        format: 'png',
        scale: width / editor.getViewportPageBounds().width,
      })

      // Convert blob to ImageData
      const imageData = await blobToImageData(result.blob, width)

      // Quantize colors and add frame
      const palette = quantize(imageData.data, 256)
      const index = applyPalette(imageData.data, palette)
      gif.writeFrame(index, width, imageData.height, {
        palette,
        delay: frameDelay,
      })

      if (onProgress) {
        onProgress((i + 1) / totalFrames)
      }
    }

    gif.finish()
    const buffer = gif.bytes()

    return new Blob([buffer], { type: 'image/gif' })
  } catch (error) {
    // gifenc not available or error occurred
    console.error('GIF export failed:', error)
    throw new Error(
      'GIF export is not available. Please install gifenc: pnpm add gifenc',
    )
  }
}

/**
 * Convert blob to ImageData
 */
async function blobToImageData(blob: Blob, targetWidth: number): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const aspectRatio = img.height / img.width
      canvas.width = targetWidth
      canvas.height = Math.floor(targetWidth * aspectRatio)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      resolve(imageData)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}
