import { createAiSession, findAiSessionById, findAiSessionsByUserId, updateAiSession, deleteAiSession } from '@creator-studio/db'
import type { AgentSession, AgentRole } from '../types/ai-types'

export async function saveSessionToDb(session: AgentSession, userId: string): Promise<void> {
  await updateAiSession(session.id, {
    messages: session.messages,
    title: session.messages[0]?.content?.slice(0, 50) ?? 'New Session',
  })
}

export async function loadSessionFromDb(sessionId: string): Promise<AgentSession | null> {
  const record = await findAiSessionById(sessionId)
  if (!record) return null
  return {
    id: record.id,
    agentRole: record.agentRole as AgentRole,
    messages: (record.messages as any[]) ?? [],
    createdAt: record.createdAt.getTime(),
    updatedAt: record.updatedAt.getTime(),
  }
}

export async function listUserSessions(userId: string): Promise<AgentSession[]> {
  const records = await findAiSessionsByUserId(userId)
  return (records as any[]).map((r: any) => ({
    id: r.id,
    agentRole: r.agentRole as AgentRole,
    messages: (r.messages as any[]) ?? [],
    createdAt: r.createdAt.getTime(),
    updatedAt: r.updatedAt.getTime(),
  }))
}

export async function createDbSession(userId: string, agentRole: AgentRole): Promise<string> {
  const session = await createAiSession({ userId, agentRole })
  return session.id
}

export async function deleteDbSession(sessionId: string): Promise<void> {
  await deleteAiSession(sessionId)
}
