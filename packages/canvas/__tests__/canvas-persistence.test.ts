import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Editor } from 'tldraw'

vi.mock('@creator-studio/db', () => ({
  createProject: vi.fn(),
  findProjectById: vi.fn(),
  updateProject: vi.fn(),
}))

const { createProject, findProjectById, updateProject } = await import('@creator-studio/db')
const { saveCanvasToProject, loadCanvasFromProject, createCanvasProject } = await import(
  '../src/lib/canvas-persistence'
)

describe('Canvas Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveCanvasToProject', () => {
    it('calls updateProject with snapshot', async () => {
      const mockSnapshot = { store: { shapes: {} } }
      const mockEditor = {
        store: {
          getStoreSnapshot: vi.fn().mockReturnValue(mockSnapshot),
        },
      } as unknown as Editor

      await saveCanvasToProject(mockEditor, 'project-123')

      expect(mockEditor.store.getStoreSnapshot).toHaveBeenCalledOnce()
      expect(updateProject).toHaveBeenCalledWith('project-123', { data: mockSnapshot })
    })
  })

  describe('loadCanvasFromProject', () => {
    it('calls editor.loadSnapshot when project has data', async () => {
      const mockData = { store: { shapes: {} } }
      vi.mocked(findProjectById).mockResolvedValue({
        id: 'project-123',
        name: 'Test',
        type: 'canvas',
        userId: 'user-1',
        data: mockData,
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnail: null,
      })

      const mockEditor = {
        store: {
          loadSnapshot: vi.fn(),
        },
      } as unknown as Editor

      await loadCanvasFromProject(mockEditor, 'project-123')

      expect(findProjectById).toHaveBeenCalledWith('project-123')
      expect(mockEditor.store.loadSnapshot).toHaveBeenCalledWith(mockData)
    })

    it('does not crash when project has null data', async () => {
      vi.mocked(findProjectById).mockResolvedValue({
        id: 'project-123',
        name: 'Test',
        type: 'canvas',
        userId: 'user-1',
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnail: null,
      })

      const mockEditor = {
        store: {
          loadSnapshot: vi.fn(),
        },
      } as unknown as Editor

      await loadCanvasFromProject(mockEditor, 'project-123')

      expect(findProjectById).toHaveBeenCalledWith('project-123')
      expect(mockEditor.store.loadSnapshot).not.toHaveBeenCalled()
    })

    it('does not crash when project is null', async () => {
      vi.mocked(findProjectById).mockResolvedValue(null)

      const mockEditor = {
        store: {
          loadSnapshot: vi.fn(),
        },
      } as unknown as Editor

      await loadCanvasFromProject(mockEditor, 'project-123')

      expect(findProjectById).toHaveBeenCalledWith('project-123')
      expect(mockEditor.store.loadSnapshot).not.toHaveBeenCalled()
    })
  })

  describe('createCanvasProject', () => {
    it('returns project ID', async () => {
      vi.mocked(createProject).mockResolvedValue({
        id: 'project-new',
        name: 'New Canvas',
        type: 'canvas',
        userId: 'user-1',
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnail: null,
      })

      const projectId = await createCanvasProject('New Canvas', 'user-1')

      expect(createProject).toHaveBeenCalledWith({
        name: 'New Canvas',
        type: 'canvas',
        userId: 'user-1',
      })
      expect(projectId).toBe('project-new')
    })
  })
})
