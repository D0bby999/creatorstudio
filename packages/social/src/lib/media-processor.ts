// Image processing via Sharp with graceful fallback
// Sharp is optional — returns pass-through results when unavailable

import type { SocialPlatform, MediaMetadata, ProcessedMedia } from '../types/social-types'
import { PLATFORM_MEDIA_RULES } from './platform-media-rules'

const MAX_INPUT_SIZE = 20 * 1024 * 1024 // 20MB hard cap

type SharpInstance = {
  resize(width: number, height: number, options?: Record<string, unknown>): SharpInstance
  jpeg(options?: { quality?: number }): SharpInstance
  png(options?: { quality?: number }): SharpInstance
  webp(options?: { quality?: number }): SharpInstance
  toBuffer(): Promise<Buffer>
  metadata(): Promise<{
    width?: number
    height?: number
    format?: string
    size?: number
    hasAlpha?: boolean
  }>
}

type SharpModule = {
  (input: Buffer): SharpInstance
}

let sharpModule: SharpModule | null | undefined = undefined

async function loadSharp(): Promise<SharpModule | null> {
  if (sharpModule !== undefined) return sharpModule
  try {
    // @ts-ignore — sharp is an optional dependency
    const mod = await import('sharp')
    sharpModule = (mod.default ?? mod) as SharpModule
    return sharpModule
  } catch {
    sharpModule = null
    return null
  }
}

export async function processImage(
  buffer: Buffer,
  platform: SocialPlatform,
  options?: { quality?: number; format?: 'jpeg' | 'png' | 'webp' }
): Promise<ProcessedMedia> {
  if (buffer.length === 0) {
    throw new Error('Cannot process empty buffer')
  }
  if (buffer.length > MAX_INPUT_SIZE) {
    throw new Error(`Input exceeds maximum size of 20MB`)
  }

  const originalSize = buffer.length
  const sharp = await loadSharp()

  if (!sharp) {
    return {
      buffer,
      metadata: { size: originalSize },
      originalSize,
      processedSize: originalSize,
    }
  }

  const rules = PLATFORM_MEDIA_RULES[platform]
  const instance = sharp(buffer)
  const meta = await instance.metadata()

  const targetWidth = rules.recommendedWidth ?? rules.maxWidth
  const targetHeight = rules.recommendedHeight ?? rules.maxHeight
  const quality = options?.quality ?? 82

  let pipeline = sharp(buffer)

  // Only resize if image exceeds target dimensions
  if ((meta.width && meta.width > targetWidth) || (meta.height && meta.height > targetHeight)) {
    pipeline = pipeline.resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
  }

  const outputFormat = options?.format ?? 'jpeg'
  if (outputFormat === 'jpeg') {
    pipeline = pipeline.jpeg({ quality })
  } else if (outputFormat === 'png') {
    pipeline = pipeline.png({ quality })
  } else if (outputFormat === 'webp') {
    pipeline = pipeline.webp({ quality })
  }

  const processed = await pipeline.toBuffer()

  return {
    buffer: processed,
    metadata: {
      width: meta.width,
      height: meta.height,
      format: outputFormat,
      size: processed.length,
      hasAlpha: meta.hasAlpha,
    },
    originalSize,
    processedSize: processed.length,
  }
}

export async function extractMediaMetadata(buffer: Buffer): Promise<MediaMetadata> {
  if (buffer.length === 0) {
    throw new Error('Cannot extract metadata from empty buffer')
  }

  const sharp = await loadSharp()

  if (!sharp) {
    return { size: buffer.length }
  }

  const meta = await sharp(buffer).metadata()
  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    size: buffer.length,
    hasAlpha: meta.hasAlpha,
  }
}

// Exposed for testing — reset the cached sharp module reference
export function resetSharpCache(): void {
  sharpModule = undefined
}
