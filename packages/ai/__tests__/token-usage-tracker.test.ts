import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trackUsage, getUsage, getUserDailyUsage, checkLimit } from '../src/lib/token-usage-tracker'
import type { TokenUsage } from '../src/types/ai-types'

vi.mock('@creator-studio/db', () => ({
  findAiSessionById: vi.fn(),
  findAiSessionsByUserId: vi.fn(),
  updateAiSession: vi.fn(),
}))

const { findAiSessionById, findAiSessionsByUserId, updateAiSession } = await import('@creator-studio/db')

describe('token-usage-tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('trackUsage', () => {
    it('should increment tokenCount', async () => {
      const existingSession = {
        id: 'session-1',
        tokenCount: 100,
        agentRole: 'writer',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
      }

      vi.mocked(findAiSessionById).mockResolvedValue(existingSession as any)

      const usage: TokenUsage = {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      }

      await trackUsage('session-1', usage)

      expect(updateAiSession).toHaveBeenCalledWith('session-1', {
        tokenCount: 130,
      })
    })

    it('should handle session with no existing tokenCount', async () => {
      const existingSession = {
        id: 'session-1',
        tokenCount: null,
        agentRole: 'writer',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
      }

      vi.mocked(findAiSessionById).mockResolvedValue(existingSession as any)

      const usage: TokenUsage = {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      }

      await trackUsage('session-1', usage)

      expect(updateAiSession).toHaveBeenCalledWith('session-1', {
        tokenCount: 30,
      })
    })
  })

  describe('getUsage', () => {
    it('should return 0 for new session', async () => {
      vi.mocked(findAiSessionById).mockResolvedValue({
        id: 'session-1',
        tokenCount: null,
        agentRole: 'writer',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
      } as any)

      const result = await getUsage('session-1')

      expect(result).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      })
    })

    it('should return existing token count', async () => {
      vi.mocked(findAiSessionById).mockResolvedValue({
        id: 'session-1',
        tokenCount: 250,
        agentRole: 'writer',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
      } as any)

      const result = await getUsage('session-1')

      expect(result.totalTokens).toBe(250)
    })
  })

  describe('getUserDailyUsage', () => {
    it('should sum today\'s tokens', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const sessions = [
        {
          id: 'session-1',
          tokenCount: 100,
          updatedAt: today,
          agentRole: 'writer',
          messages: [],
          createdAt: today,
          userId: 'user-1',
        },
        {
          id: 'session-2',
          tokenCount: 200,
          updatedAt: today,
          agentRole: 'researcher',
          messages: [],
          createdAt: today,
          userId: 'user-1',
        },
        {
          id: 'session-3',
          tokenCount: 50,
          updatedAt: yesterday,
          agentRole: 'designer',
          messages: [],
          createdAt: yesterday,
          userId: 'user-1',
        },
      ]

      vi.mocked(findAiSessionsByUserId).mockResolvedValue(sessions as any)

      const result = await getUserDailyUsage('user-1')

      expect(result).toBe(300)
    })
  })

  describe('checkLimit', () => {
    it('should return false when over limit', async () => {
      vi.mocked(findAiSessionsByUserId).mockResolvedValue([
        {
          id: 'session-1',
          tokenCount: 500,
          updatedAt: new Date(),
          agentRole: 'writer',
          messages: [],
          createdAt: new Date(),
          userId: 'user-1',
        },
      ] as any)

      const result = await checkLimit('user-1', 400)

      expect(result).toBe(false)
    })

    it('should return true when under limit', async () => {
      vi.mocked(findAiSessionsByUserId).mockResolvedValue([
        {
          id: 'session-1',
          tokenCount: 200,
          updatedAt: new Date(),
          agentRole: 'writer',
          messages: [],
          createdAt: new Date(),
          userId: 'user-1',
        },
      ] as any)

      const result = await checkLimit('user-1', 1000)

      expect(result).toBe(true)
    })
  })
})
