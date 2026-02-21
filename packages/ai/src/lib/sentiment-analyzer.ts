/**
 * Sentiment analysis using AI structured output + heuristic fallback
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { resolveModelForTask } from './model-resolver'

// Schema
export const SentimentResultSchema = z.object({
  results: z.array(z.object({
    text: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
    confidence: z.number().min(0).max(1),
    emotions: z.array(z.string()),
  })),
})
export type SentimentResult = z.infer<typeof SentimentResultSchema>['results'][number]

const BATCH_SIZE = 50

/**
 * Analyze sentiment for multiple texts using AI structured output
 * Falls back to heuristic analysis when AI is unavailable
 */
export async function analyzeSentiment(texts: string[]): Promise<SentimentResult[]> {
  if (texts.length === 0) return []

  try {
    const results: SentimentResult[] = []

    // Process in batches
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)
      const batchResults = await analyzeSentimentBatch(batch)
      results.push(...batchResults)
    }

    return results
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return analyzeSentimentHeuristic(texts)
  }
}

/**
 * Analyze sentiment for a single batch
 */
async function analyzeSentimentBatch(texts: string[]): Promise<SentimentResult[]> {
  const { object } = await generateObject({
    model: resolveModelForTask('sentiment'),
    schema: SentimentResultSchema,
    prompt: `Analyze the sentiment of the following texts. For each text, determine:
- sentiment: positive, negative, neutral, or mixed
- confidence: 0-1 score of how confident you are
- emotions: array of detected emotions (joy, anger, sadness, fear, surprise, etc.)

Texts:
${texts.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

Return results in the same order as the input texts.`,
    temperature: 0.3,
  })

  return object.results
}

/**
 * Fallback heuristic sentiment analysis when AI is unavailable
 */
export function analyzeSentimentHeuristic(texts: string[]): SentimentResult[] {
  return texts.map(text => {
    const lowerText = text.toLowerCase()

    // Positive and negative keyword lists
    const positiveKeywords = ['love', 'great', 'amazing', 'excellent', 'happy', 'wonderful', 'fantastic', 'awesome', 'best', 'perfect']
    const negativeKeywords = ['hate', 'terrible', 'awful', 'bad', 'disappointed', 'worst', 'horrible', 'angry', 'sad', 'poor']

    // Count keyword occurrences
    const positiveCount = positiveKeywords.filter(keyword => lowerText.includes(keyword)).length
    const negativeCount = negativeKeywords.filter(keyword => lowerText.includes(keyword)).length

    // Determine sentiment
    let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
    let confidence: number
    let emotions: string[] = []

    if (positiveCount > 0 && negativeCount > 0) {
      sentiment = 'mixed'
      confidence = 0.6
      emotions = ['mixed feelings']
    } else if (positiveCount > negativeCount) {
      sentiment = 'positive'
      confidence = Math.min(0.9, 0.5 + (positiveCount * 0.1))
      emotions = ['joy']
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative'
      confidence = Math.min(0.9, 0.5 + (negativeCount * 0.1))
      emotions = ['disappointment']
    } else {
      sentiment = 'neutral'
      confidence = 0.7
      emotions = ['neutral']
    }

    return {
      text,
      sentiment,
      confidence,
      emotions,
    }
  })
}
