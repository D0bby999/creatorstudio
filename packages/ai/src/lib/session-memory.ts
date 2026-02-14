import type { AgentSession, ChatMessage, AgentRole } from '../types/ai-types'
import { cacheGet, cacheSet, cacheDel, cacheGetByPrefix } from '@creator-studio/redis/cache'

const SESSION_PREFIX = 'ai:session:'
const SESSION_TTL = 86400 // 24 hours

/**
 * Creates a new agent session
 */
export async function createSession(agentRole: AgentRole): Promise<AgentSession> {
  const now = Date.now()
  const session: AgentSession = {
    id: crypto.randomUUID(),
    agentRole,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }

  await cacheSet(`${SESSION_PREFIX}${session.id}`, session, SESSION_TTL)
  return session
}

/**
 * Gets a session by ID
 */
export async function getSession(id: string): Promise<AgentSession | null> {
  return cacheGet<AgentSession>(`${SESSION_PREFIX}${id}`)
}

/**
 * Gets all sessions sorted by most recent
 */
export async function getSessions(): Promise<AgentSession[]> {
  const sessions = await cacheGetByPrefix<AgentSession>(SESSION_PREFIX)
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Adds a message to a session
 */
export async function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<ChatMessage> {
  const session = await cacheGet<AgentSession>(`${SESSION_PREFIX}${sessionId}`)
  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }

  const chatMessage: ChatMessage = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }

  session.messages.push(chatMessage)
  session.updatedAt = Date.now()
  await cacheSet(`${SESSION_PREFIX}${sessionId}`, session, SESSION_TTL)

  return chatMessage
}

/**
 * Deletes a session
 */
export async function deleteSession(id: string): Promise<boolean> {
  await cacheDel(`${SESSION_PREFIX}${id}`)
  return true
}

/**
 * Clears all sessions (useful for testing)
 */
export async function clearSessions(): Promise<void> {
  const sessions = await cacheGetByPrefix<AgentSession>(SESSION_PREFIX)
  await Promise.all(sessions.map((s) => cacheDel(`${SESSION_PREFIX}${s.id}`)))
}
