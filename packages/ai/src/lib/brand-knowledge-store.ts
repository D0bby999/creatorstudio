/**
 * Redis-backed brand knowledge store for RAG
 * Key pattern: ai:brand:{userId}:{entryId}
 * Index key: ai:brand:index:{userId} (Set of entryIds)
 */

import { getRedis } from '@creator-studio/redis'
import { generateEmbedding } from './embedding-generator'
import { cosineSimilarity } from './cosine-similarity'
import type { BrandEntry, BrandEntryType } from '../types/ai-types'

export const MAX_BRAND_ENTRIES = 100

function brandKey(userId: string, entryId: string): string {
  return `ai:brand:${userId}:${entryId}`
}

function indexKey(userId: string): string {
  return `ai:brand:index:${userId}`
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function requireRedis() {
  const redis = getRedis()
  if (!redis) throw new Error('Redis unavailable for brand knowledge store')
  return redis
}

export async function addBrandEntry(
  userId: string,
  input: { type: BrandEntryType; content: string }
): Promise<BrandEntry> {
  const redis = requireRedis()
  const embedding = await generateEmbedding(input.content)

  const entry: BrandEntry = {
    id: generateId(),
    userId,
    type: input.type,
    content: input.content,
    embedding,
    createdAt: Date.now(),
  }

  // FIFO pruning: if at capacity, remove oldest
  const existingIds = await redis.smembers(indexKey(userId))
  if (existingIds.length >= MAX_BRAND_ENTRIES) {
    const entries = await loadAllEntries(userId)
    const sorted = entries.sort((a, b) => a.createdAt - b.createdAt)
    const toRemove = sorted.slice(0, existingIds.length - MAX_BRAND_ENTRIES + 1)
    for (const old of toRemove) {
      await removeBrandEntry(userId, old.id)
    }
  }

  await redis.set(brandKey(userId, entry.id), JSON.stringify(entry))
  await redis.sadd(indexKey(userId), entry.id)

  return entry
}

export async function removeBrandEntry(userId: string, entryId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(brandKey(userId, entryId))
    await redis.srem(indexKey(userId), entryId)
  } catch (error) {
    console.error('Brand store delete failed:', error)
  }
}

export async function listBrandEntries(userId: string): Promise<BrandEntry[]> {
  try {
    return await loadAllEntries(userId)
  } catch {
    return []
  }
}

export async function searchSimilar(
  userId: string,
  queryEmbedding: number[],
  topK = 5
): Promise<BrandEntry[]> {
  try {
    const entries = await loadAllEntries(userId)
    if (entries.length === 0) return []

    const scored = entries.map(entry => ({
      entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }))

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.entry)
  } catch {
    return []
  }
}

async function loadAllEntries(userId: string): Promise<BrandEntry[]> {
  const redis = getRedis()
  if (!redis) return []

  const entryIds = await redis.smembers(indexKey(userId))
  if (entryIds.length === 0) return []

  const entries: BrandEntry[] = []
  for (const id of entryIds) {
    const raw = await redis.get(brandKey(userId, id))
    if (raw) {
      entries.push(JSON.parse(raw as string) as BrandEntry)
    }
  }

  return entries
}
