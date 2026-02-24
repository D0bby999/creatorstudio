/**
 * Background Remover Client
 * Client for AI background removal API
 */

/**
 * Remove background from image using AI
 * @param imageUrl - URL of the image to process
 * @returns Promise resolving to processed image URL
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    const response = await fetch('/api/canvas/ai-remove-bg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message || `Background removal failed: ${response.statusText}`
      )
    }

    const data = await response.json()
    if (!data.resultUrl) {
      throw new Error('No result URL returned from API')
    }

    return data.resultUrl
  } catch (error) {
    console.error('Background removal error:', error)
    throw error instanceof Error
      ? error
      : new Error('Failed to remove background')
  }
}
