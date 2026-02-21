/**
 * RAG context retrieval for brand-aware content generation
 * Generates embedding for user prompt, finds similar brand entries, formats as context string
 */

import { generateEmbedding } from './embedding-generator'
import { searchSimilar } from './brand-knowledge-store'

/**
 * Retrieve brand context for a user prompt
 * Returns formatted context string for injection into AI generation prompts
 * Never throws — returns empty string on any failure (graceful degradation)
 */
export async function getBrandContext(
  userId: string,
  prompt: string,
  topK = 5
): Promise<string> {
  try {
    const queryEmbedding = await generateEmbedding(prompt)
    const entries = await searchSimilar(userId, queryEmbedding, topK)

    if (entries.length === 0) return ''

    const lines = entries.map(
      entry => `[${entry.type}] ${entry.content}`
    )

    return `Brand context:\n\n${lines.join('\n\n')}`
  } catch {
    // Never block generation — empty context is acceptable
    return ''
  }
}
