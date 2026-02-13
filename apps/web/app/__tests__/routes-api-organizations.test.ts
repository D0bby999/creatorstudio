import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@creator-studio/db/client', () => ({
  prisma: {
    organization: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    organizationMember: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('~/lib/auth-server', () => ({
  requireSession: vi.fn(),
}))

import { action } from '../routes/api.organizations'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'

const mockPrisma = vi.mocked(prisma)
const mockRequireSession = vi.mocked(requireSession)

describe('Organization API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('action - create', () => {
    it('creates organization with owner membership for valid name', async () => {
      const mockOrg = { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp', createdAt: new Date() }
      const mockMember = { userId: 'user-1', organizationId: 'org-1', role: 'owner' }

      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1', name: 'John Doe' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organization.findUnique.mockResolvedValue(null)
      mockPrisma.organization.create.mockResolvedValue(mockOrg as any)
      mockPrisma.organizationMember.create.mockResolvedValue(mockMember as any)

      const formData = new FormData()
      formData.append('action', 'create')
      formData.append('name', 'Acme Corp')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.organization).toEqual(mockOrg)
      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: { name: 'Acme Corp', slug: 'acme-corp' },
      })
      expect(mockPrisma.organizationMember.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', organizationId: 'org-1', role: 'owner' },
      })
    })

    it('returns 400 for missing name', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      const formData = new FormData()
      formData.append('action', 'create')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Name is required')
    })

    it('returns 400 for short name', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      const formData = new FormData()
      formData.append('action', 'create')
      formData.append('name', 'A')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Name is required')
    })

    it('handles slug collision by appending timestamp suffix', async () => {
      const mockOrg = { id: 'org-2', name: 'Acme Corp 2', slug: 'acme-corp-abc123', createdAt: new Date() }

      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      // First call returns existing org (collision), second returns null
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        slug: 'acme-corp',
      } as any)

      mockPrisma.organization.create.mockResolvedValue(mockOrg as any)
      mockPrisma.organizationMember.create.mockResolvedValue({} as any)

      const formData = new FormData()
      formData.append('action', 'create')
      formData.append('name', 'Acme Corp')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockPrisma.organization.create).toHaveBeenCalled()
      const createCall = mockPrisma.organization.create.mock.calls[0][0]
      expect(createCall.data.slug).toMatch(/^acme-corp-/)
    })
  })

  describe('action - update', () => {
    it('allows admin to update organization', async () => {
      const mockOrg = { id: 'org-1', name: 'Updated Acme', slug: 'updated-acme' }

      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'admin',
      } as any)

      mockPrisma.organization.findUnique.mockResolvedValue(null)
      mockPrisma.organization.update.mockResolvedValue(mockOrg as any)

      const formData = new FormData()
      formData.append('action', 'update')
      formData.append('organizationId', 'org-1')
      formData.append('name', 'Updated Acme')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.organization).toEqual(mockOrg)
    })

    it('denies member from updating organization', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'member',
      } as any)

      const formData = new FormData()
      formData.append('action', 'update')
      formData.append('organizationId', 'org-1')
      formData.append('name', 'Updated Name')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Insufficient permissions')
    })

    it('returns 400 when organizationId missing', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      const formData = new FormData()
      formData.append('action', 'update')
      formData.append('name', 'Updated Name')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('organizationId required')
    })
  })

  describe('action - delete', () => {
    it('allows owner to delete organization', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'owner',
      } as any)

      mockPrisma.organization.delete.mockResolvedValue({
        id: 'org-1',
      } as any)

      const formData = new FormData()
      formData.append('action', 'delete')
      formData.append('organizationId', 'org-1')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.organization.delete).toHaveBeenCalledWith({
        where: { id: 'org-1' },
      })
    })

    it('denies admin from deleting organization', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'admin',
      } as any)

      const formData = new FormData()
      formData.append('action', 'delete')
      formData.append('organizationId', 'org-1')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Only owner can delete')
    })

    it('returns 400 when organizationId missing', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      const formData = new FormData()
      formData.append('action', 'delete')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('organizationId required')
    })
  })

  describe('action - add-member', () => {
    it('allows admin to add member', async () => {
      const mockMember = {
        userId: 'user-2',
        organizationId: 'org-1',
        role: 'member',
        user: { id: 'user-2', name: 'Jane Doe', email: 'jane@example.com' },
      }

      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'admin',
      } as any)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'jane@example.com',
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValueOnce({
        role: 'admin',
      } as any)
      mockPrisma.organizationMember.findUnique.mockResolvedValueOnce(null)

      mockPrisma.organizationMember.create.mockResolvedValue(mockMember as any)

      const formData = new FormData()
      formData.append('action', 'add-member')
      formData.append('organizationId', 'org-1')
      formData.append('email', 'jane@example.com')
      formData.append('role', 'member')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.member).toEqual(mockMember)
    })

    it('returns 409 when user already member', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'admin',
      } as any)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'jane@example.com',
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValueOnce({
        role: 'admin',
      } as any)
      mockPrisma.organizationMember.findUnique.mockResolvedValueOnce({
        userId: 'user-2',
        role: 'member',
      } as any)

      const formData = new FormData()
      formData.append('action', 'add-member')
      formData.append('organizationId', 'org-1')
      formData.append('email', 'jane@example.com')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('already a member')
    })

    it('returns 404 when user not found', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'admin',
      } as any)

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const formData = new FormData()
      formData.append('action', 'add-member')
      formData.append('organizationId', 'org-1')
      formData.append('email', 'nonexistent@example.com')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found')
    })

    it('returns 400 when organizationId or email missing', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      const formData = new FormData()
      formData.append('action', 'add-member')
      formData.append('organizationId', 'org-1')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('organizationId and email required')
    })
  })

  describe('action - remove-member', () => {
    it('allows admin to remove member', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'admin',
      } as any)

      mockPrisma.organizationMember.delete.mockResolvedValue({
        userId: 'user-2',
        organizationId: 'org-1',
      } as any)

      const formData = new FormData()
      formData.append('action', 'remove-member')
      formData.append('organizationId', 'org-1')
      formData.append('userId', 'user-2')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('returns 400 when removing last owner', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'owner',
      } as any)

      mockPrisma.organizationMember.count.mockResolvedValue(1)

      const formData = new FormData()
      formData.append('action', 'remove-member')
      formData.append('organizationId', 'org-1')
      formData.append('userId', 'user-1')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Cannot remove the last owner')
    })

    it('returns 400 when organizationId or userId missing', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      const formData = new FormData()
      formData.append('action', 'remove-member')
      formData.append('organizationId', 'org-1')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('organizationId and userId required')
    })
  })

  describe('action - invalid action', () => {
    it('returns 400 for invalid action type', async () => {
      mockRequireSession.mockResolvedValue({
        user: { id: 'user-1' },
        session: { id: 'session-1' },
      } as any)

      const formData = new FormData()
      formData.append('action', 'invalid-action')

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      })

      const response = await action({ request })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid action')
    })
  })
})
