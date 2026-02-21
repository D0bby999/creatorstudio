// Draft post persistence — Redis-backed with in-memory fallback
// Key pattern: social:draft:{userId}:{draftId}, TTL 24h

import { cacheGet, cacheSet, cacheDel, cacheGetByPrefix, clearMemoryStore } from '@creator-studio/redis/cache'
import type { DraftPost, SocialPlatform } from '../types/social-types'

const DRAFT_PREFIX = 'social:draft'
const DRAFT_TTL_SECONDS = 86400 // 24 hours
const MAX_DRAFTS_PER_USER = 50

function draftKey(userId: string, draftId: string): string {
  return `${DRAFT_PREFIX}:${userId}:${draftId}`
}

function userDraftPrefix(userId: string): string {
  return `${DRAFT_PREFIX}:${userId}:`
}

export interface SaveDraftInput {
  content: string
  mediaUrls?: string[]
  platforms?: SocialPlatform[]
}

export async function saveDraft(userId: string, input: SaveDraftInput): Promise<DraftPost> {
  const existingDrafts = await listDrafts(userId)
  if (existingDrafts.length >= MAX_DRAFTS_PER_USER) {
    throw new Error(`Maximum drafts limit reached (${MAX_DRAFTS_PER_USER})`)
  }

  const now = Date.now()
  const draft: DraftPost = {
    id: crypto.randomUUID(),
    userId,
    content: input.content,
    mediaUrls: input.mediaUrls ?? [],
    platforms: input.platforms ?? [],
    createdAt: now,
    updatedAt: now,
  }

  await cacheSet(draftKey(userId, draft.id), draft, DRAFT_TTL_SECONDS)
  return draft
}

export async function getDraft(userId: string, draftId: string): Promise<DraftPost | null> {
  return cacheGet<DraftPost>(draftKey(userId, draftId))
}

export async function listDrafts(userId: string): Promise<DraftPost[]> {
  const drafts = await cacheGetByPrefix<DraftPost>(userDraftPrefix(userId))
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function updateDraft(
  userId: string,
  draftId: string,
  input: Partial<SaveDraftInput>
): Promise<DraftPost | null> {
  const existing = await getDraft(userId, draftId)
  if (!existing) return null

  const updated: DraftPost = {
    ...existing,
    ...(input.content !== undefined && { content: input.content }),
    ...(input.mediaUrls !== undefined && { mediaUrls: input.mediaUrls }),
    ...(input.platforms !== undefined && { platforms: input.platforms }),
    updatedAt: Date.now(),
  }

  await cacheSet(draftKey(userId, draftId), updated, DRAFT_TTL_SECONDS)
  return updated
}

export async function deleteDraft(userId: string, draftId: string): Promise<void> {
  await cacheDel(draftKey(userId, draftId))
}

// For testing — clears the in-memory fallback store
export { clearMemoryStore as clearDraftStore }
