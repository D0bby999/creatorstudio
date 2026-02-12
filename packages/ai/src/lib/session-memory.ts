import type { AgentSession, ChatMessage, AgentRole } from '../types/ai-types'

// In-memory session storage (MVP - can be replaced with Redis later)
const sessions = new Map<string, AgentSession>()

/**
 * Creates a new agent session
 */
export function createSession(agentRole: AgentRole): AgentSession {
  const now = Date.now()
  const session: AgentSession = {
    id: crypto.randomUUID(),
    agentRole,
    messages: [],
    createdAt: now,
    updatedAt: now
  }

  sessions.set(session.id, session)
  return session
}

/**
 * Gets a session by ID
 */
export function getSession(id: string): AgentSession | null {
  return sessions.get(id) ?? null
}

/**
 * Gets all sessions sorted by most recent
 */
export function getSessions(): AgentSession[] {
  return Array.from(sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Adds a message to a session
 */
export function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): ChatMessage {
  const session = sessions.get(sessionId)
  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }

  const chatMessage: ChatMessage = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  }

  session.messages.push(chatMessage)
  session.updatedAt = Date.now()

  return chatMessage
}

/**
 * Deletes a session
 */
export function deleteSession(id: string): boolean {
  return sessions.delete(id)
}

/**
 * Clears all sessions (useful for testing)
 */
export function clearSessions(): void {
  sessions.clear()
}
