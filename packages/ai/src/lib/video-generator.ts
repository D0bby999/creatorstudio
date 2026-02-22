/**
 * Video generation via @ai-sdk/replicate official provider
 * Thin provider abstraction for future swappability (Runway/Pika)
 */

import { experimental_generateVideo } from 'ai'
import { createReplicate } from '@ai-sdk/replicate'

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
}

const DEFAULT_MODEL = 'minimax/video-01'
const MAX_PROMPT_LENGTH = 1000

class ReplicateVideoProvider implements VideoProvider {
  async generateVideo(prompt: string, options?: VideoGenerationOptions): Promise<VideoGenerationResult> {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN environment variable is required')
    }

    const replicate = createReplicate()
    const sanitizedPrompt = prompt.slice(0, MAX_PROMPT_LENGTH)

    const result = await experimental_generateVideo({
      model: replicate.video(DEFAULT_MODEL),
      prompt: sanitizedPrompt,
      aspectRatio: options?.aspectRatio ?? '16:9',
    })

    const video = result.video
    if (!video) {
      throw new Error('No video generated from Replicate')
    }

    const base64 = video.base64
    const url = base64 ? `data:${video.mediaType};base64,${base64}` : ''

    return {
      id: 'generated',
      url,
      status: 'completed',
      duration: options?.duration ?? 5,
    }
  }
}

export function createVideoProvider(): VideoProvider {
  return new ReplicateVideoProvider()
}
