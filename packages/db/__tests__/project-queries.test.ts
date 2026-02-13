import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma client
vi.mock('../src/client', () => ({
  prisma: {
    project: {
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
  createProject,
  findProjectById,
  findProjectsByUserId,
  updateProject,
  deleteProject,
} from '../src/queries/project-queries'

describe('project-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createProject', () => {
    it('should create project with all fields', async () => {
      const mockProject = {
        id: 'proj_123',
        name: 'Test Project',
        type: 'canvas',
        userId: 'user_123',
        data: { version: 1 },
        createdAt: new Date(),
      }

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any)

      const result = await createProject({
        name: 'Test Project',
        type: 'canvas',
        userId: 'user_123',
        data: { version: 1 },
      })

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Project',
          type: 'canvas',
          userId: 'user_123',
          data: { version: 1 },
        },
      })
      expect(result).toEqual(mockProject)
    })
  })

  describe('findProjectById', () => {
    it('should find project by id', async () => {
      const mockProject = { id: 'proj_123', name: 'Test Project' }

      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)

      const result = await findProjectById('proj_123')

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj_123' },
      })
      expect(result).toEqual(mockProject)
    })

    it('should return null if not found', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

      const result = await findProjectById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findProjectsByUserId', () => {
    it('should find all projects for user ordered by createdAt', async () => {
      const mockProjects = [
        { id: 'proj_1', name: 'Project 1', userId: 'user_123' },
        { id: 'proj_2', name: 'Project 2', userId: 'user_123' },
      ]

      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects as any)

      const result = await findProjectsByUserId('user_123')

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockProjects)
    })
  })

  describe('updateProject', () => {
    it('should update project fields', async () => {
      const mockUpdated = {
        id: 'proj_123',
        name: 'Updated Name',
        thumbnail: 'https://example.com/thumb.jpg',
      }

      vi.mocked(prisma.project.update).mockResolvedValue(mockUpdated as any)

      const result = await updateProject('proj_123', {
        name: 'Updated Name',
        thumbnail: 'https://example.com/thumb.jpg',
      })

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj_123' },
        data: { name: 'Updated Name', thumbnail: 'https://example.com/thumb.jpg' },
      })
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('deleteProject', () => {
    it('should delete project', async () => {
      const mockDeleted = { id: 'proj_123', name: 'Test Project' }

      vi.mocked(prisma.project.delete).mockResolvedValue(mockDeleted as any)

      const result = await deleteProject('proj_123')

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'proj_123' },
      })
      expect(result).toEqual(mockDeleted)
    })
  })
})
