/**
 * Caption variant generation using AI structured output + heuristic fallback
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { resolveModelForTask } from './model-resolver'
import { getPlatformRule } from './platform-adaptation-rules'

// Co-located schema
export const CaptionVariantSchema = z.object({
  variants: z.array(
    z.object({
      content: z.string(),
      hook: z.string(),
      hashtags: z.array(z.string()),
      style: z.string(),
    })
  ),
  testingHypothesis: z.string(),
})
export type CaptionVariantResult = z.infer<typeof CaptionVariantSchema>

/**
 * Generate caption variants for A/B testing
 * Falls back to heuristic variants when AI is unavailable
 */
export async function generateCaptionVariants(
  content: string,
  platform: string,
  count: number = 3,
  brandContext?: string
): Promise<CaptionVariantResult> {
  const validCount = Math.min(Math.max(1, count), 5)
  const rule = getPlatformRule(platform)

  try {
    const brandPrompt = brandContext
      ? `\n\nBrand context: ${brandContext}`
      : ''

    const { object } = await generateObject({
      model: resolveModelForTask('caption-variant'),
      schema: CaptionVariantSchema,
      prompt: `Generate ${validCount} caption variants for ${platform} based on this content:

"${content}"

Platform constraints:
- Max characters: ${rule.maxChars}
- Hashtag range: ${rule.hashtagRange[0]}-${rule.hashtagRange[1]}
- Tone: ${rule.defaultTone}
- CTA style: ${rule.ctaStyle}${brandPrompt}

Create variants with different hook types:
1. Question hook (start with engaging question)
2. Statistic/fact hook (start with compelling number or fact)
3. Story hook (start with brief narrative or scenario)
4. Bold claim hook (start with provocative statement)

Each variant should have different content, hook, relevant hashtags, and style description.
Provide a testing hypothesis explaining what each variant aims to test.`,
      temperature: 0.8,
    })

    return object
  } catch (error) {
    console.error('Caption variant generation error:', error)
    return generateCaptionVariantsHeuristic(content, platform, validCount)
  }
}

/**
 * Fallback heuristic variant generation when AI is unavailable
 */
export function generateCaptionVariantsHeuristic(
  content: string,
  platform: string,
  count: number
): CaptionVariantResult {
  const rule = getPlatformRule(platform)
  const baseHashtags = extractHashtags(content)
  const variants = []

  // Variant 1: Question hook
  if (count >= 1) {
    variants.push({
      content: `Question: What if ${content.slice(0, 100)}...?`,
      hook: 'Engaging question to spark curiosity',
      hashtags: baseHashtags.slice(0, rule.hashtagRange[1]),
      style: 'Curiosity-driven, interrogative',
    })
  }

  // Variant 2: Statistic hook
  if (count >= 2) {
    variants.push({
      content: `Did you know: 80% of creators overlook this. ${content.slice(0, 100)}...`,
      hook: 'Compelling statistic to grab attention',
      hashtags: baseHashtags.slice(0, rule.hashtagRange[1]),
      style: 'Data-driven, authoritative',
    })
  }

  // Variant 3: Story hook
  if (count >= 3) {
    variants.push({
      content: `Story: When I first learned about this... ${content.slice(0, 100)}`,
      hook: 'Personal narrative to build connection',
      hashtags: baseHashtags.slice(0, rule.hashtagRange[1]),
      style: 'Narrative, relatable',
    })
  }

  // Variant 4: Bold claim hook
  if (count >= 4) {
    variants.push({
      content: `Bold claim: This changes everything. ${content.slice(0, 100)}...`,
      hook: 'Provocative statement to create intrigue',
      hashtags: baseHashtags.slice(0, rule.hashtagRange[1]),
      style: 'Assertive, controversial',
    })
  }

  // Variant 5: Direct approach
  if (count >= 5) {
    variants.push({
      content: content.slice(0, rule.maxChars),
      hook: 'Direct, no-nonsense approach',
      hashtags: baseHashtags.slice(0, rule.hashtagRange[1]),
      style: 'Straightforward, clear',
    })
  }

  return {
    variants: variants.slice(0, count),
    testingHypothesis: `Testing different hook styles (question, statistic, story, bold claim) to identify which resonates best with ${platform} audience.`,
  }
}

/**
 * Extract hashtags from content
 */
function extractHashtags(content: string): string[] {
  const matches = content.match(/#\w+/g)
  return matches ? matches : ['#content', '#social', '#marketing']
}
