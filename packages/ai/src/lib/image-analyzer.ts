import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export type ImageAnalysisTask = 'alt-text' | 'describe' | 'ocr' | 'content-tags'

const TASK_PROMPTS: Record<ImageAnalysisTask, string> = {
  'alt-text':
    'Generate a concise, accessible alt text description for this image. Keep it under 125 characters. Focus on the key visual elements and context.',
  describe:
    'Describe this image in detail, including colors, composition, subjects, mood, and any text visible. Be thorough but organized.',
  ocr: 'Extract all visible text from this image. Preserve the layout and formatting as much as possible. Return only the extracted text.',
  'content-tags':
    'List relevant tags and categories for this image, separated by commas. Include subject matter, style, mood, colors, and potential use cases.',
}

/**
 * Analyzes an image using OpenAI vision model (gpt-4o)
 * Supports both URL strings and Buffer inputs
 */
export async function analyzeImage(
  imageData: Buffer | string,
  task: ImageAnalysisTask
): Promise<string> {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const model = openai('gpt-4o')

  // Build image content part with SSRF validation for URLs
  let imagePart: { type: 'image'; image: URL | Buffer }
  if (typeof imageData === 'string') {
    const url = new URL(imageData)
    if (url.protocol !== 'https:') {
      throw new Error('Image URL must use HTTPS')
    }
    const blockedHosts = ['169.254.169.254', 'metadata.google.internal', '10.', '172.16.', '192.168.', '127.', 'localhost']
    if (blockedHosts.some(h => url.hostname.startsWith(h) || url.hostname === h)) {
      throw new Error('Image URL points to a restricted host')
    }
    imagePart = { type: 'image' as const, image: url }
  } else {
    imagePart = { type: 'image' as const, image: imageData }
  }

  const result = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [imagePart, { type: 'text', text: TASK_PROMPTS[task] }],
      },
    ],
  })

  return result.text
}

/**
 * Convenience wrapper for generating alt text
 */
export async function generateAltText(imageData: Buffer | string): Promise<string> {
  return analyzeImage(imageData, 'alt-text')
}
