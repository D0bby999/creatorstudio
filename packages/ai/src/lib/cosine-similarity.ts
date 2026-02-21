/**
 * Cosine similarity for embedding vector comparison
 * Pure math utility — no external dependencies
 */

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)
  if (magnitude === 0) return 0

  return dotProduct / magnitude
}
