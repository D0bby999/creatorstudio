import { updateAiSession, findAiSessionById, findAiSessionsByUserId } from '@creator-studio/db'
import type { TokenUsage } from '../types/ai-types'

export async function trackUsage(sessionId: string, usage: TokenUsage): Promise<void> {
  const session = await findAiSessionById(sessionId)
  const currentCount = session?.tokenCount ?? 0
  await updateAiSession(sessionId, {
    tokenCount: currentCount + usage.totalTokens,
  })
}

export async function getUsage(sessionId: string): Promise<TokenUsage> {
  const session = await findAiSessionById(sessionId)
  const total = session?.tokenCount ?? 0
  return { promptTokens: 0, completionTokens: 0, totalTokens: total }
}

export async function getUserDailyUsage(userId: string): Promise<number> {
  const sessions = await findAiSessionsByUserId(userId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return sessions
    .filter(s => s.updatedAt >= today)
    .reduce((sum, s) => sum + (s.tokenCount ?? 0), 0)
}

export async function checkLimit(userId: string, limit: number): Promise<boolean> {
  const usage = await getUserDailyUsage(userId)
  return usage < limit
}
