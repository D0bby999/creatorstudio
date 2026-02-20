import type { AgentSession, ChatMessage, AgentRole } from '../types/ai-types'
import { cacheGet, cacheSet, cacheDel, cacheGetByPrefix } from '@creator-studio/redis/cache'

const SESSION_PREFIX = 'ai:session:'
const SESSION_TTL = 86400 // 24 hours
const VALID_SESSION_ID = /^[a-zA-Z0-9_\-]+$/

function validateSessionId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new Error('Session ID must be a non-empty string')
  }
  if (id.length > 128) {
    throw new Error('Session ID exceeds maximum length')
  }
  if (!VALID_SESSION_ID.test(id)) {
    throw new Error('Session ID contains invalid characters')
  }
}

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
  validateSessionId(id)
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
  validateSessionId(sessionId)
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
  validateSessionId(id)
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
