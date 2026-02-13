import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma client
vi.mock('../src/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '../src/client'
import {
  findUserById,
  findUserByEmail,
  updateUser,
  deleteUser,
} from '../src/queries/user-queries'

describe('user-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findUserById', () => {
    it('should find user by id with sessions', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        sessions: [],
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await findUserById('user_123')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        include: { sessions: true },
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await findUserById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await findUserByEmail('test@example.com')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(result).toEqual(mockUser)
    })
  })

  describe('updateUser', () => {
    it('should update user with provided data', async () => {
      const mockUpdated = {
        id: 'user_123',
        name: 'Updated Name',
        image: 'https://example.com/avatar.jpg',
      }

      vi.mocked(prisma.user.update).mockResolvedValue(mockUpdated as any)

      const result = await updateUser('user_123', {
        name: 'Updated Name',
        image: 'https://example.com/avatar.jpg',
      })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { name: 'Updated Name', image: 'https://example.com/avatar.jpg' },
      })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const mockDeleted = { id: 'user_123', email: 'test@example.com' }

      vi.mocked(prisma.user.delete).mockResolvedValue(mockDeleted as any)

      const result = await deleteUser('user_123')

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user_123' },
      })
      expect(result).toEqual(mockDeleted)
    })
  })
})
