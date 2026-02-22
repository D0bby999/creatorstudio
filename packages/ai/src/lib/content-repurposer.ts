/**
 * Content repurposing engine
 * Adapts source content for multiple target platforms via parallel AI generation
 */

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { resolveModelForTask } from './model-resolver'
import { getPlatformRule } from './platform-adaptation-rules'

export const AdaptedContentSchema = z.object({
  platform: z.string(),
  content: z.string(),
  hashtags: z.array(z.string()),
  characterCount: z.number(),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'educational', 'humorous']),
  cta: z.string(),
})
export type AdaptedContent = z.infer<typeof AdaptedContentSchema>

export const MAX_TARGET_PLATFORMS = 5

export async function repurposeContent(
  source: string,
  sourcePlatform: string,
  targetPlatforms: string[],
  brandContext?: string
): Promise<AdaptedContent[]> {
  if (targetPlatforms.length > MAX_TARGET_PLATFORMS) {
    throw new Error(`Maximum ${MAX_TARGET_PLATFORMS} target platforms allowed, got ${targetPlatforms.length}`)
  }

  if (targetPlatforms.length === 0) {
    return []
  }

  try {
    const results = await Promise.allSettled(
      targetPlatforms.map(platform => generateAdaptedContent(source, sourcePlatform, platform, brandContext))
    )

    const adapted: AdaptedContent[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        adapted.push(result.value)
      } else {
        console.error('Platform adaptation failed:', result.reason)
      }
    }

    return adapted.length > 0 ? adapted : repurposeContentHeuristic(source, targetPlatforms)
  } catch (error) {
    console.error('Content repurposing error:', error)
    return repurposeContentHeuristic(source, targetPlatforms)
  }
}

async function generateAdaptedContent(
  source: string,
  sourcePlatform: string,
  targetPlatform: string,
  brandContext?: string
): Promise<AdaptedContent> {
  const rule = getPlatformRule(targetPlatform)
  const brandPrompt = brandContext ? `\nBrand context:\n${brandContext}\n` : ''

  const { output } = await generateText({
    model: resolveModelForTask('repurpose'),
    output: Output.object({ schema: AdaptedContentSchema }),
    prompt: `Adapt this ${sourcePlatform} content for ${targetPlatform}.
${brandPrompt}
Source content: "${source}"

Platform rules for ${targetPlatform}:
- Character limit: ${rule.minChars}-${rule.maxChars}
- Hashtags: ${rule.hashtagRange[0]}-${rule.hashtagRange[1]}
- Tone: ${rule.defaultTone}
- Emoji level: ${rule.emojiLevel}
- CTA style: ${rule.ctaStyle}

Adapt the content naturally for ${targetPlatform}. Preserve the core message but adjust format, length, tone, and hashtags for the target platform.`,
    temperature: 0.6,
  })

  // Post-process: enforce char limits
  const truncated = output!.content.length > rule.maxChars
    ? output!.content.slice(0, rule.maxChars)
    : output!.content

  return {
    ...output!,
    platform: targetPlatform,
    content: truncated,
    characterCount: truncated.length,
  }
}

export function repurposeContentHeuristic(
  source: string,
  targetPlatforms: string[]
): AdaptedContent[] {
  return targetPlatforms.map(platform => {
    const rule = getPlatformRule(platform)
    let content = source.slice(0, rule.maxChars)

    // Extract existing hashtags
    const existingHashtags = (source.match(/#\w+/g) || []).map(t => t.replace('#', ''))
    const hashtags = existingHashtags.slice(0, rule.hashtagRange[1])

    if (content.length < rule.minChars) {
      content = content.padEnd(rule.minChars, '.')
    }

    return {
      platform,
      content,
      hashtags,
      characterCount: content.length,
      tone: 'casual' as const,
      cta: `Check out more on ${platform}!`,
    }
  })
}
