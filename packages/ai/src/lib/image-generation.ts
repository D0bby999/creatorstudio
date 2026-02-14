/**
 * Image generation via Replicate API
 * Uses Stability AI SDXL model for text-to-image generation
 */

interface ImageGenerationOptions {
  model?: string
  width?: number
  height?: number
}

interface ImageGenerationResult {
  url: string
  id: string
}

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions'
const DEFAULT_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
const MAX_POLL_ATTEMPTS = 300 // 5 minutes at 1s intervals

/**
 * Generate image from text prompt using Replicate API
 */
export async function generateImage(
  prompt: string,
  options?: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const token = process.env.REPLICATE_API_TOKEN

  if (!token) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set')
  }

  const model = options?.model || DEFAULT_MODEL
  const width = options?.width || 1024
  const height = options?.height || 1024

  // Create prediction
  const response = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: model,
      input: {
        prompt,
        width,
        height,
        num_outputs: 1,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Replicate API error: ${error}`)
  }

  const prediction = await response.json()
  const predictionId = prediction.id

  // Poll for completion with timeout
  let result = prediction
  let attempts = 0

  while (result.status !== 'succeeded' && result.status !== 'failed') {
    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw new Error('Image generation timed out after 5 minutes')
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    const pollResponse = await fetch(`${REPLICATE_API_URL}/${predictionId}`, {
      headers: {
        'Authorization': `Token ${token}`,
      },
    })

    if (!pollResponse.ok) {
      throw new Error('Failed to poll prediction status')
    }

    result = await pollResponse.json()
    attempts++
  }

  if (result.status === 'failed') {
    throw new Error(`Image generation failed: ${result.error || 'Unknown error'}`)
  }

  const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output

  if (!imageUrl) {
    throw new Error('No image URL returned from Replicate')
  }

  return {
    url: imageUrl,
    id: predictionId,
  }
}
