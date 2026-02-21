/**
 * Tone adjustment using AI structured output + heuristic fallback
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { resolveModelForTask } from './model-resolver'

// Co-located schema
export const AdjustedContentSchema = z.object({
  content: z.string(),
  originalTone: z.string(),
  adjustedTone: z.string(),
  changes: z.array(z.string()),
})
export type AdjustedContent = z.infer<typeof AdjustedContentSchema>

export interface ToneSettings {
  formality: number // 0-1
  humor: number // 0-1
  detail: number // 0-1
}

/**
 * Adjust content tone using AI structured output
 * Falls back to heuristic adjustments when AI is unavailable
 */
export async function adjustTone(
  content: string,
  settings: ToneSettings,
  brandContext?: string
): Promise<AdjustedContent> {
  try {
    const formalityDesc = getFormalityDescription(settings.formality)
    const humorDesc = getHumorDescription(settings.humor)
    const detailDesc = getDetailDescription(settings.detail)

    const brandPrompt = brandContext
      ? `\n\nBrand context: ${brandContext}`
      : ''

    const { object } = await generateObject({
      model: resolveModelForTask('tone-adjust'),
      schema: AdjustedContentSchema,
      prompt: `Adjust the tone of this content based on the following settings:
- Formality: ${formalityDesc} (${settings.formality.toFixed(1)})
- Humor: ${humorDesc} (${settings.humor.toFixed(1)})
- Detail: ${detailDesc} (${settings.detail.toFixed(1)})

Original content: "${content}"${brandPrompt}

Rewrite the content to match these tone settings while preserving the core message.
Identify the original tone, the adjusted tone, and list specific changes made.`,
      temperature: 0.6,
    })

    return object
  } catch (error) {
    console.error('Tone adjustment error:', error)
    return adjustToneHeuristic(content, settings)
  }
}

/**
 * Fallback heuristic tone adjustment when AI is unavailable
 */
export function adjustToneHeuristic(
  content: string,
  settings: ToneSettings
): AdjustedContent {
  let adjusted = content
  const changes: string[] = []

  // High formality: remove contractions
  if (settings.formality > 0.7) {
    const contractions: Record<string, string> = {
      "can't": 'cannot',
      "don't": 'do not',
      "won't": "will not",
      "isn't": 'is not',
      "aren't": "are not",
      "wasn't": 'was not',
      "weren't": 'were not',
      "hasn't": 'has not',
      "haven't": 'have not',
      "hadn't": 'had not',
      "doesn't": 'does not',
      "didn't": 'did not',
      "shouldn't": 'should not',
      "wouldn't": 'would not',
      "couldn't": 'could not',
      "mightn't": 'might not',
      "mustn't": 'must not',
      "I'm": 'I am',
      "you're": 'you are',
      "we're": 'we are',
      "they're": 'they are',
      "it's": 'it is',
      "that's": 'that is',
      "what's": 'what is',
      "there's": 'there is',
      "here's": 'here is',
    }

    for (const [contraction, expansion] of Object.entries(contractions)) {
      const regex = new RegExp(contraction, 'gi')
      if (regex.test(adjusted)) {
        adjusted = adjusted.replace(regex, expansion)
        changes.push(`Replaced contractions for formality`)
        break
      }
    }
  }

  // Low humor: remove emojis
  if (settings.humor < 0.3) {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
    if (emojiRegex.test(adjusted)) {
      adjusted = adjusted.replace(emojiRegex, '')
      changes.push('Removed emojis for serious tone')
    }
  }

  // High detail: add filler phrases
  if (settings.detail > 0.7) {
    const fillers = [
      'It is important to note that',
      'As a matter of fact,',
      'In other words,',
      'To elaborate,',
    ]
    const randomFiller = fillers[Math.floor(Math.random() * fillers.length)]
    adjusted = `${randomFiller} ${adjusted}`
    changes.push('Added detail-enhancing phrases')
  }

  // Low detail: simplify by removing extra clauses
  if (settings.detail < 0.3) {
    // Remove parenthetical clauses
    if (adjusted.includes('(') && adjusted.includes(')')) {
      adjusted = adjusted.replace(/\([^)]*\)/g, '')
      changes.push('Removed parenthetical details')
    }
  }

  const originalTone = getToneLabel(0.5, 0.5, 0.5)
  const adjustedTone = getToneLabel(settings.formality, settings.humor, settings.detail)

  if (changes.length === 0) {
    changes.push('No significant adjustments needed')
  }

  return {
    content: adjusted.trim(),
    originalTone,
    adjustedTone,
    changes,
  }
}

// Helper functions
function getFormalityDescription(value: number): string {
  if (value > 0.8) return 'very formal, professional language'
  if (value > 0.6) return 'formal, polished'
  if (value > 0.4) return 'neutral, balanced'
  if (value > 0.2) return 'casual, conversational'
  return 'very casual, informal'
}

function getHumorDescription(value: number): string {
  if (value > 0.8) return 'very humorous, playful, witty'
  if (value > 0.6) return 'moderately humorous, lighthearted'
  if (value > 0.4) return 'neutral, balanced tone'
  if (value > 0.2) return 'serious, minimal humor'
  return 'very serious, no humor'
}

function getDetailDescription(value: number): string {
  if (value > 0.8) return 'very detailed, comprehensive, elaborate'
  if (value > 0.6) return 'detailed, thorough'
  if (value > 0.4) return 'balanced detail level'
  if (value > 0.2) return 'concise, to-the-point'
  return 'very brief, minimal details'
}

function getToneLabel(formality: number, humor: number, detail: number): string {
  const labels: string[] = []

  if (formality > 0.6) labels.push('formal')
  else if (formality < 0.4) labels.push('casual')

  if (humor > 0.6) labels.push('humorous')
  else if (humor < 0.4) labels.push('serious')

  if (detail > 0.6) labels.push('detailed')
  else if (detail < 0.4) labels.push('concise')

  return labels.length > 0 ? labels.join(', ') : 'neutral'
}
