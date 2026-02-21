/**
 * Embedding generation via @ai-sdk/openai embed()
 * Uses text-embedding-3-small (1536 dimensions)
 */

import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * Generate embedding vector for a text string
 * No heuristic fallback — embeddings are meaningless without real vectors
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required for embedding generation')
  }

  if (!text.trim()) {
    throw new Error('Cannot generate embedding for empty text')
  }

  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  })

  return embedding
}

/**
 * Generate embeddings for multiple texts in a single batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required for embedding generation')
  }

  const results = await Promise.all(
    texts.filter(t => t.trim()).map(text => generateEmbedding(text))
  )

  return results
}
