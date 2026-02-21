/**
 * AI-powered video script generation
 * Produces structured scripts compatible with Remotion Sequence components
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { resolveModelForTask } from './model-resolver'

export const VideoScriptSchema = z.object({
  title: z.string(),
  scenes: z.array(z.object({
    description: z.string(),
    duration: z.number(),
    transition: z.enum(['cut', 'fade', 'dissolve', 'slide', 'none']),
    textOverlay: z.string().optional(),
    narration: z.string().optional(),
  })),
  totalDuration: z.number(),
  narration: z.string(),
  style: z.string(),
})
export type VideoScript = z.infer<typeof VideoScriptSchema>

export interface VideoScriptOptions {
  duration?: number
  style?: 'educational' | 'promotional' | 'storytelling' | 'tutorial'
  sceneCount?: number
  brandContext?: string
}

export async function generateVideoScript(
  topic: string,
  options?: VideoScriptOptions
): Promise<VideoScript> {
  const duration = options?.duration ?? 60
  const style = options?.style ?? 'educational'
  const sceneCount = options?.sceneCount ?? 5
  const brandPrompt = options?.brandContext ? `\nBrand context:\n${options.brandContext}\n` : ''

  try {
    const { object } = await generateObject({
      model: resolveModelForTask('video-script'),
      schema: VideoScriptSchema,
      prompt: `Create a ${style} video script about: "${topic}"
${brandPrompt}
Requirements:
- Total duration: ~${duration} seconds
- Number of scenes: ${sceneCount}
- Style: ${style}
- Each scene needs: description, duration (in seconds), transition type, optional text overlay, optional narration
- Scene durations must sum to approximately ${duration} seconds
- Transitions: use 'cut' for fast pacing, 'fade' for emotional beats, 'dissolve' for time passing`,
      temperature: 0.7,
    })

    // Post-process: ensure totalDuration matches scene sum
    const sceneSum = object.scenes.reduce((sum, s) => sum + s.duration, 0)
    return { ...object, totalDuration: sceneSum }
  } catch (error) {
    console.error('Video script generation error:', error)
    return generateVideoScriptHeuristic(topic, duration, style)
  }
}

function generateVideoScriptHeuristic(
  topic: string,
  duration: number,
  style: string
): VideoScript {
  const introDuration = Math.round(duration * 0.15)
  const mainDuration = Math.round(duration * 0.7)
  const outroDuration = duration - introDuration - mainDuration

  return {
    title: topic,
    scenes: [
      {
        description: `Opening hook introducing the topic: ${topic}`,
        duration: introDuration,
        transition: 'fade',
        textOverlay: topic,
        narration: `Welcome! Today we're covering ${topic}.`,
      },
      {
        description: `Main content exploring ${topic} in detail`,
        duration: mainDuration,
        transition: 'cut',
        narration: `Let's dive into the key points about ${topic}.`,
      },
      {
        description: `Conclusion and call to action`,
        duration: outroDuration,
        transition: 'fade',
        textOverlay: 'Thanks for watching!',
        narration: `That's everything about ${topic}. Like and subscribe for more!`,
      },
    ],
    totalDuration: duration,
    narration: `A ${style} video about ${topic}`,
    style,
  }
}
