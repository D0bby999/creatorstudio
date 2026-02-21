/**
 * Video generation via Luma Dream Machine API
 * Thin provider abstraction for future swappability (Runway/Pika)
 */

export interface VideoGenerationOptions {
  duration?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  resolution?: '720p' | '1080p'
}

export interface VideoGenerationResult {
  id: string
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  duration: number
  thumbnailUrl?: string
}

export interface VideoProvider {
  generateVideo(prompt: string, options?: VideoGenerationOptions): Promise<VideoGenerationResult>
  pollStatus(id: string): Promise<VideoGenerationResult>
}

const LUMA_API_URL = 'https://api.lumalabs.ai/dream-machine/v1/generations'
const MAX_POLL_ATTEMPTS = 300 // 10 min at 2s intervals
const POLL_INTERVAL_MS = 2000
const MAX_PROMPT_LENGTH = 1000

class LumaVideoProvider implements VideoProvider {
  private apiKey: string

  constructor() {
    const key = process.env.LUMA_API_KEY
    if (!key) throw new Error('LUMA_API_KEY environment variable is required')
    this.apiKey = key
  }

  async generateVideo(prompt: string, options?: VideoGenerationOptions): Promise<VideoGenerationResult> {
    const sanitizedPrompt = prompt.slice(0, MAX_PROMPT_LENGTH)

    const response = await fetch(LUMA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: sanitizedPrompt,
        aspect_ratio: options?.aspectRatio ?? '16:9',
        loop: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Luma API error: ${error}`)
    }

    const data = await response.json()
    return this.pollUntilComplete(data.id)
  }

  async pollStatus(id: string): Promise<VideoGenerationResult> {
    const response = await fetch(`${LUMA_API_URL}/${id}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    })

    if (!response.ok) throw new Error('Failed to poll video generation status')

    const data = await response.json()
    return mapLumaResponse(data)
  }

  private async pollUntilComplete(id: string): Promise<VideoGenerationResult> {
    let attempts = 0

    while (attempts < MAX_POLL_ATTEMPTS) {
      const result = await this.pollStatus(id)

      if (result.status === 'completed' || result.status === 'failed') {
        if (result.status === 'failed') {
          throw new Error(`Video generation failed for id: ${id}`)
        }
        return result
      }

      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
      attempts++
    }

    throw new Error(`Video generation timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`)
  }
}

function mapLumaResponse(data: Record<string, unknown>): VideoGenerationResult {
  const assets = data.assets as Record<string, string> | undefined
  return {
    id: data.id as string,
    url: assets?.video ?? '',
    status: mapStatus(data.state as string),
    duration: 5,
    thumbnailUrl: assets?.thumbnail,
  }
}

function mapStatus(state: string): VideoGenerationResult['status'] {
  switch (state) {
    case 'completed': return 'completed'
    case 'failed': return 'failed'
    case 'queued': return 'pending'
    default: return 'processing'
  }
}

export function createVideoProvider(): VideoProvider {
  return new LumaVideoProvider()
}
