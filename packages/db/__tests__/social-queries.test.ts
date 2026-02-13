import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma client
vi.mock('../src/client', () => ({
  prisma: {
    socialAccount: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    socialPost: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '../src/client'
import {
  createSocialAccount,
  findSocialAccountsByUserId,
  createSocialPost,
  findDuePosts,
  updatePostStatus,
} from '../src/queries/social-queries'

describe('social-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSocialAccount', () => {
    it('should create social account', async () => {
      const mockAccount = {
        id: 'acc_123',
        platform: 'instagram',
        platformUserId: 'ig_123',
        username: 'testuser',
        accessToken: 'token_123',
        userId: 'user_123',
      }

      vi.mocked(prisma.socialAccount.create).mockResolvedValue(mockAccount as any)

      const result = await createSocialAccount({
        platform: 'instagram',
        platformUserId: 'ig_123',
        username: 'testuser',
        accessToken: 'token_123',
        userId: 'user_123',
      })

      expect(prisma.socialAccount.create).toHaveBeenCalledWith({
        data: {
          platform: 'instagram',
          platformUserId: 'ig_123',
          username: 'testuser',
          accessToken: 'token_123',
          userId: 'user_123',
        },
      })
      expect(result).toEqual(mockAccount)
    })
  })

  describe('findSocialAccountsByUserId', () => {
    it('should find all social accounts for user', async () => {
      const mockAccounts = [
        { id: 'acc_1', platform: 'instagram', userId: 'user_123' },
        { id: 'acc_2', platform: 'instagram', userId: 'user_123' },
      ]

      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue(mockAccounts as any)

      const result = await findSocialAccountsByUserId('user_123')

      expect(prisma.socialAccount.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockAccounts)
    })
  })

  describe('createSocialPost', () => {
    it('should create social post', async () => {
      const mockPost = {
        id: 'post_123',
        content: 'Test post',
        mediaUrls: ['https://example.com/img.jpg'],
        platform: 'instagram',
        status: 'draft',
        socialAccountId: 'acc_123',
      }

      vi.mocked(prisma.socialPost.create).mockResolvedValue(mockPost as any)

      const result = await createSocialPost({
        content: 'Test post',
        mediaUrls: ['https://example.com/img.jpg'],
        platform: 'instagram',
        status: 'draft',
        socialAccountId: 'acc_123',
      })

      expect(prisma.socialPost.create).toHaveBeenCalledWith({
        data: {
          content: 'Test post',
          mediaUrls: ['https://example.com/img.jpg'],
          platform: 'instagram',
          status: 'draft',
          socialAccountId: 'acc_123',
        },
      })
      expect(result).toEqual(mockPost)
    })
  })

  describe('findDuePosts', () => {
    it('should find posts due for publishing', async () => {
      const now = new Date()
      const mockPosts = [
        {
          id: 'post_1',
          status: 'scheduled',
          scheduledAt: new Date(now.getTime() - 1000),
          socialAccount: { id: 'acc_123' },
        },
      ]

      vi.mocked(prisma.socialPost.findMany).mockResolvedValue(mockPosts as any)

      const result = await findDuePosts()

      expect(prisma.socialPost.findMany).toHaveBeenCalledWith({
        where: {
          status: 'scheduled',
          scheduledAt: {
            lte: expect.any(Date),
          },
        },
        include: {
          socialAccount: true,
        },
      })
      expect(result).toEqual(mockPosts)
    })
  })

  describe('updatePostStatus', () => {
    it('should update post status to published with platformPostId', async () => {
      const mockUpdated = {
        id: 'post_123',
        status: 'published',
        platformPostId: 'ig_post_123',
        publishedAt: expect.any(Date),
      }

      vi.mocked(prisma.socialPost.update).mockResolvedValue(mockUpdated as any)

      const result = await updatePostStatus('post_123', 'published', 'ig_post_123')

      expect(prisma.socialPost.update).toHaveBeenCalledWith({
        where: { id: 'post_123' },
        data: {
          status: 'published',
          platformPostId: 'ig_post_123',
          publishedAt: expect.any(Date),
        },
      })
      expect(result).toEqual(mockUpdated)
    })

    it('should update post status to failed without publishedAt', async () => {
      const mockUpdated = {
        id: 'post_123',
        status: 'failed',
      }

      vi.mocked(prisma.socialPost.update).mockResolvedValue(mockUpdated as any)

      await updatePostStatus('post_123', 'failed')

      expect(prisma.socialPost.update).toHaveBeenCalledWith({
        where: { id: 'post_123' },
        data: {
          status: 'failed',
          platformPostId: undefined,
          publishedAt: undefined,
        },
      })
    })
  })
})
