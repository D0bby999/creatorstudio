/**
 * Inngest function: Canvas AI video generation
 * Generates video via Replicate, uploads to R2, stores result in Redis
 */

import { inngest } from '../inngest-client'
import { cacheSet } from '@creator-studio/redis'
import { createVideoProvider } from '@creator-studio/ai/lib/video-generator'

interface CanvasVideoGenEvent {
  data: {
    jobId: string
    userId: string
    prompt: string
    aspectRatio: '16:9' | '9:16' | '1:1'
  }
}

export const canvasVideoGenJob = inngest.createFunction(
  {
    id: 'canvas-video-gen',
    name: 'Canvas Video Generation',
    retries: 1,
  },
  { event: 'canvas/video.generate' },
  async ({ event, step }) => {
    const { jobId, userId, prompt, aspectRatio } =
      event.data as CanvasVideoGenEvent['data']

    const statusKey = `canvas:video:${userId}:${jobId}`

    // Mark as processing
    await step.run('mark-processing', async () => {
      await cacheSet(statusKey, JSON.stringify({ status: 'processing' }), 3600)
    })

    // Generate video via Replicate
    const videoResult = await step.run('generate-video', async () => {
      try {
        const provider = createVideoProvider()
        const result = await provider.generateVideo(prompt, { aspectRatio })
        return { url: result.url, mediaType: result.mediaType ?? 'video/mp4' }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Video generation failed'
        await cacheSet(statusKey, JSON.stringify({ status: 'failed', error: errorMsg }), 3600)
        throw err
      }
    })

    // Store completion in Redis
    // In production, upload to R2 here; for now store the URL directly
    await step.run('store-result', async () => {
      await cacheSet(
        statusKey,
        JSON.stringify({
          status: 'completed',
          videoUrl: videoResult.url,
          mediaType: videoResult.mediaType,
        }),
        3600
      )
    })

    return { jobId, status: 'completed', videoUrl: videoResult.url }
  }
)
