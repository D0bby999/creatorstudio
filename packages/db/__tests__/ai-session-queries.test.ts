import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma client
vi.mock('../src/client', () => ({
  prisma: {
    aiSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '../src/client'
import {
  createAiSession,
  findAiSessionById,
  findAiSessionsByUserId,
  updateAiSession,
  deleteAiSession,
} from '../src/queries/ai-session-queries'

describe('ai-session-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAiSession', () => {
    it('should create AI session with required fields', async () => {
      const mockSession = {
        id: 'sess_123',
        userId: 'user_123',
        agentRole: 'assistant',
        messages: [],
        tokenCount: 0,
      }

      vi.mocked(prisma.aiSession.create).mockResolvedValue(mockSession as any)

      const result = await createAiSession({
        userId: 'user_123',
        agentRole: 'assistant',
      })

      expect(prisma.aiSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          agentRole: 'assistant',
        },
      })
      expect(result).toEqual(mockSession)
    })

    it('should create AI session with optional title', async () => {
      const mockSession = {
        id: 'sess_123',
        userId: 'user_123',
        agentRole: 'assistant',
        title: 'My Chat',
      }

      vi.mocked(prisma.aiSession.create).mockResolvedValue(mockSession as any)

      await createAiSession({
        userId: 'user_123',
        agentRole: 'assistant',
        title: 'My Chat',
      })

      expect(prisma.aiSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          agentRole: 'assistant',
          title: 'My Chat',
        },
      })
    })
  })

  describe('findAiSessionById', () => {
    it('should find AI session by id', async () => {
      const mockSession = { id: 'sess_123', userId: 'user_123', agentRole: 'assistant' }

      vi.mocked(prisma.aiSession.findUnique).mockResolvedValue(mockSession as any)

      const result = await findAiSessionById('sess_123')

      expect(prisma.aiSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'sess_123' },
      })
      expect(result).toEqual(mockSession)
    })

    it('should return null if not found', async () => {
      vi.mocked(prisma.aiSession.findUnique).mockResolvedValue(null)

      const result = await findAiSessionById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findAiSessionsByUserId', () => {
    it('should find all AI sessions for user ordered by updatedAt', async () => {
      const mockSessions = [
        { id: 'sess_1', userId: 'user_123', agentRole: 'assistant' },
        { id: 'sess_2', userId: 'user_123', agentRole: 'designer' },
      ]

      vi.mocked(prisma.aiSession.findMany).mockResolvedValue(mockSessions as any)

      const result = await findAiSessionsByUserId('user_123')

      expect(prisma.aiSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        orderBy: { updatedAt: 'desc' },
      })
      expect(result).toEqual(mockSessions)
    })
  })

  describe('updateAiSession', () => {
    it('should update AI session with messages and tokenCount', async () => {
      const mockUpdated = {
        id: 'sess_123',
        messages: [{ role: 'user', content: 'Hello' }],
        tokenCount: 150,
      }

      vi.mocked(prisma.aiSession.update).mockResolvedValue(mockUpdated as any)

      const result = await updateAiSession('sess_123', {
        messages: [{ role: 'user', content: 'Hello' }],
        tokenCount: 150,
      })

      expect(prisma.aiSession.update).toHaveBeenCalledWith({
        where: { id: 'sess_123' },
        data: {
          messages: [{ role: 'user', content: 'Hello' }],
          tokenCount: 150,
        },
      })
      expect(result).toEqual(mockUpdated)
    })

    it('should update AI session title', async () => {
      const mockUpdated = {
        id: 'sess_123',
        title: 'Updated Title',
      }

      vi.mocked(prisma.aiSession.update).mockResolvedValue(mockUpdated as any)

      await updateAiSession('sess_123', {
        title: 'Updated Title',
      })

      expect(prisma.aiSession.update).toHaveBeenCalledWith({
        where: { id: 'sess_123' },
        data: {
          title: 'Updated Title',
        },
      })
    })
  })

  describe('deleteAiSession', () => {
    it('should delete AI session', async () => {
      const mockDeleted = { id: 'sess_123', userId: 'user_123' }

      vi.mocked(prisma.aiSession.delete).mockResolvedValue(mockDeleted as any)

      const result = await deleteAiSession('sess_123')

      expect(prisma.aiSession.delete).toHaveBeenCalledWith({
        where: { id: 'sess_123' },
      })
      expect(result).toEqual(mockDeleted)
    })
  })
})
