/**
 * Image generation via @ai-sdk/replicate official provider
 * Uses Stability AI SDXL model for text-to-image generation
 */

import { generateImage as sdkGenerateImage } from 'ai'
import { createReplicate } from '@ai-sdk/replicate'

interface ImageGenerationOptions {
  model?: string
  width?: number
  height?: number
}

interface ImageGenerationResult {
  url: string
  id: string
}

const DEFAULT_MODEL = 'stability-ai/sdxl'

export async function generateImage(
  prompt: string,
  options?: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set')
  }

  const replicate = createReplicate()
  const model = options?.model || DEFAULT_MODEL
  const width = options?.width || 1024
  const height = options?.height || 1024

  const result = await sdkGenerateImage({
    model: replicate.image(model),
    prompt,
    size: `${width}x${height}`,
  })

  const image = result.image
  if (!image) {
    throw new Error('No image generated from Replicate')
  }

  // SDK returns Uint8Array data — convert to base64 data URL
  const base64 = image.base64
  const url = base64 ? `data:${image.mediaType};base64,${base64}` : ''

  return { url, id: 'generated' }
}
