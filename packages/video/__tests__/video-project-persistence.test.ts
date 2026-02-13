import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveVideoProject, loadVideoProject, createVideoProjectRecord } from '../src/lib/video-project-persistence'
import type { VideoProject } from '../src/types/video-types'

// Mock @creator-studio/db
vi.mock('@creator-studio/db', () => ({
  createProject: vi.fn(),
  findProjectById: vi.fn(),
  updateProject: vi.fn(),
}))

import { createProject, findProjectById, updateProject } from '@creator-studio/db'

describe('video-project-persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveVideoProject', () => {
    it('should call updateProject with project data', async () => {
      const mockProject: VideoProject = {
        id: 'proj1',
        name: 'Test Project',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 300,
        tracks: [],
      }

      await saveVideoProject(mockProject, 'proj1')

      expect(updateProject).toHaveBeenCalledWith('proj1', { data: mockProject })
      expect(updateProject).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadVideoProject', () => {
    it('should return null for missing project', async () => {
      vi.mocked(findProjectById).mockResolvedValue(null)

      const result = await loadVideoProject('nonexistent')

      expect(result).toBeNull()
      expect(findProjectById).toHaveBeenCalledWith('nonexistent')
    })

    it('should return project data when found', async () => {
      const mockVideoProject: VideoProject = {
        id: 'proj1',
        name: 'Test Project',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 300,
        tracks: [],
      }

      vi.mocked(findProjectById).mockResolvedValue({
        id: 'proj1',
        name: 'Test Project',
        type: 'video',
        userId: 'user1',
        data: mockVideoProject,
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnail: null,
      })

      const result = await loadVideoProject('proj1')

      expect(result).toEqual(mockVideoProject)
      expect(findProjectById).toHaveBeenCalledWith('proj1')
    })

    it('should return null when project has no data', async () => {
      vi.mocked(findProjectById).mockResolvedValue({
        id: 'proj1',
        name: 'Test Project',
        type: 'video',
        userId: 'user1',
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnail: null,
      })

      const result = await loadVideoProject('proj1')

      expect(result).toBeNull()
    })
  })

  describe('createVideoProjectRecord', () => {
    it('should create project and return ID', async () => {
      vi.mocked(createProject).mockResolvedValue({
        id: 'new-proj-id',
        name: 'New Video Project',
        type: 'video',
        userId: 'user123',
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnail: null,
      })

      const projectId = await createVideoProjectRecord('New Video Project', 'user123')

      expect(projectId).toBe('new-proj-id')
      expect(createProject).toHaveBeenCalledWith({
        name: 'New Video Project',
        type: 'video',
        userId: 'user123',
      })
    })
  })
})
