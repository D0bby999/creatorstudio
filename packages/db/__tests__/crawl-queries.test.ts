import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma client
vi.mock('../src/client', () => ({
  prisma: {
    crawlJob: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '../src/client'
import {
  createCrawlJob,
  findCrawlJobById,
  findCrawlJobsByStatus,
  updateCrawlJobStatus,
  findCrawlJobsByUserId,
} from '../src/queries/crawl-queries'

describe('crawl-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCrawlJob', () => {
    it('should create crawl job with default priority', async () => {
      const mockJob = {
        id: 'job_123',
        url: 'https://example.com',
        type: 'url',
        status: 'pending',
        userId: 'user_123',
        priority: 0,
      }

      vi.mocked(prisma.crawlJob.create).mockResolvedValue(mockJob as any)

      const result = await createCrawlJob({
        url: 'https://example.com',
        type: 'url',
        userId: 'user_123',
      })

      expect(prisma.crawlJob.create).toHaveBeenCalledWith({
        data: {
          url: 'https://example.com',
          type: 'url',
          userId: 'user_123',
          priority: 0,
        },
      })
      expect(result).toEqual(mockJob)
    })

    it('should create crawl job with custom priority', async () => {
      const mockJob = {
        id: 'job_123',
        url: 'https://example.com',
        type: 'seo',
        userId: 'user_123',
        priority: 5,
      }

      vi.mocked(prisma.crawlJob.create).mockResolvedValue(mockJob as any)

      await createCrawlJob({
        url: 'https://example.com',
        type: 'seo',
        userId: 'user_123',
        priority: 5,
      })

      expect(prisma.crawlJob.create).toHaveBeenCalledWith({
        data: {
          url: 'https://example.com',
          type: 'seo',
          userId: 'user_123',
          priority: 5,
        },
      })
    })
  })

  describe('findCrawlJobById', () => {
    it('should find crawl job by id', async () => {
      const mockJob = { id: 'job_123', url: 'https://example.com' }

      vi.mocked(prisma.crawlJob.findUnique).mockResolvedValue(mockJob as any)

      const result = await findCrawlJobById('job_123')

      expect(prisma.crawlJob.findUnique).toHaveBeenCalledWith({
        where: { id: 'job_123' },
      })
      expect(result).toEqual(mockJob)
    })

    it('should return null if not found', async () => {
      vi.mocked(prisma.crawlJob.findUnique).mockResolvedValue(null)

      const result = await findCrawlJobById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findCrawlJobsByStatus', () => {
    it('should find jobs by status ordered by priority', async () => {
      const mockJobs = [
        { id: 'job_1', status: 'pending', priority: 10 },
        { id: 'job_2', status: 'pending', priority: 5 },
      ]

      vi.mocked(prisma.crawlJob.findMany).mockResolvedValue(mockJobs as any)

      const result = await findCrawlJobsByStatus('pending')

      expect(prisma.crawlJob.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { priority: 'desc' },
      })
      expect(result).toEqual(mockJobs)
    })
  })

  describe('updateCrawlJobStatus', () => {
    it('should update status to completed with result and completedAt', async () => {
      const mockUpdated = {
        id: 'job_123',
        status: 'completed',
        result: { data: 'test' },
        completedAt: expect.any(Date),
      }

      vi.mocked(prisma.crawlJob.update).mockResolvedValue(mockUpdated as any)

      const result = await updateCrawlJobStatus('job_123', 'completed', { data: 'test' })

      expect(prisma.crawlJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          status: 'completed',
          result: { data: 'test' },
          error: undefined,
          completedAt: expect.any(Date),
        },
      })
      expect(result).toEqual(mockUpdated)
    })

    it('should update status to failed with error and completedAt', async () => {
      const mockUpdated = {
        id: 'job_123',
        status: 'failed',
        error: 'Network error',
        completedAt: expect.any(Date),
      }

      vi.mocked(prisma.crawlJob.update).mockResolvedValue(mockUpdated as any)

      await updateCrawlJobStatus('job_123', 'failed', undefined, 'Network error')

      expect(prisma.crawlJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          status: 'failed',
          result: undefined,
          error: 'Network error',
          completedAt: expect.any(Date),
        },
      })
    })

    it('should update status to running without completedAt', async () => {
      const mockUpdated = {
        id: 'job_123',
        status: 'running',
        completedAt: undefined,
      }

      vi.mocked(prisma.crawlJob.update).mockResolvedValue(mockUpdated as any)

      await updateCrawlJobStatus('job_123', 'running')

      expect(prisma.crawlJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          status: 'running',
          result: undefined,
          error: undefined,
          completedAt: undefined,
        },
      })
    })
  })

  describe('findCrawlJobsByUserId', () => {
    it('should find all crawl jobs for user', async () => {
      const mockJobs = [
        { id: 'job_1', userId: 'user_123', url: 'https://example.com' },
        { id: 'job_2', userId: 'user_123', url: 'https://test.com' },
      ]

      vi.mocked(prisma.crawlJob.findMany).mockResolvedValue(mockJobs as any)

      const result = await findCrawlJobsByUserId('user_123')

      expect(prisma.crawlJob.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockJobs)
    })
  })
})
