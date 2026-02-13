import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  saveSessionToDb,
  loadSessionFromDb,
  listUserSessions,
  createDbSession,
  deleteDbSession,
} from '../src/lib/session-persistence'
import type { AgentSession } from '../src/types/ai-types'

vi.mock('@creator-studio/db', () => ({
  createAiSession: vi.fn(),
  findAiSessionById: vi.fn(),
  findAiSessionsByUserId: vi.fn(),
  updateAiSession: vi.fn(),
  deleteAiSession: vi.fn(),
}))

const {
  createAiSession,
  findAiSessionById,
  findAiSessionsByUserId,
  updateAiSession,
  deleteAiSession,
} = await import('@creator-studio/db')

describe('session-persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveSessionToDb', () => {
    it('should call updateAiSession', async () => {
      const session: AgentSession = {
        id: 'session-1',
        agentRole: 'writer',
        messages: [{ id: 'msg-1', role: 'user', content: 'Hello world', timestamp: Date.now() }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await saveSessionToDb(session, 'user-1')

      expect(updateAiSession).toHaveBeenCalledWith('session-1', {
        messages: session.messages,
        title: 'Hello world',
      })
    })
  })

  describe('loadSessionFromDb', () => {
    it('should return null for nonexistent session', async () => {
      vi.mocked(findAiSessionById).mockResolvedValue(null)

      const result = await loadSessionFromDb('nonexistent')

      expect(result).toBeNull()
    })

    it('should map DB record to AgentSession shape', async () => {
      const dbRecord = {
        id: 'session-1',
        agentRole: 'researcher',
        messages: [{ id: 'msg-1', role: 'user', content: 'Test', timestamp: 123 }],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        userId: 'user-1',
        tokenCount: 100,
      }

      vi.mocked(findAiSessionById).mockResolvedValue(dbRecord as any)

      const result = await loadSessionFromDb('session-1')

      expect(result).toEqual({
        id: 'session-1',
        agentRole: 'researcher',
        messages: [{ id: 'msg-1', role: 'user', content: 'Test', timestamp: 123 }],
        createdAt: new Date('2024-01-01').getTime(),
        updatedAt: new Date('2024-01-02').getTime(),
      })
    })
  })

  describe('listUserSessions', () => {
    it('should return array of sessions', async () => {
      const dbRecords = [
        {
          id: 'session-1',
          agentRole: 'writer',
          messages: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          userId: 'user-1',
          tokenCount: 50,
        },
        {
          id: 'session-2',
          agentRole: 'designer',
          messages: [],
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          userId: 'user-1',
          tokenCount: 100,
        },
      ]

      vi.mocked(findAiSessionsByUserId).mockResolvedValue(dbRecords as any)

      const result = await listUserSessions('user-1')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('session-1')
      expect(result[1].id).toBe('session-2')
    })
  })

  describe('createDbSession', () => {
    it('should return session ID', async () => {
      vi.mocked(createAiSession).mockResolvedValue({
        id: 'new-session',
        agentRole: 'planner',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        tokenCount: 0,
      } as any)

      const result = await createDbSession('user-1', 'planner')

      expect(result).toBe('new-session')
      expect(createAiSession).toHaveBeenCalledWith({
        userId: 'user-1',
        agentRole: 'planner',
      })
    })
  })

  describe('deleteDbSession', () => {
    it('should call deleteAiSession', async () => {
      await deleteDbSession('session-1')

      expect(deleteAiSession).toHaveBeenCalledWith('session-1')
    })
  })
})
