import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auth-server
vi.mock('../src/auth-server', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

import { requireAuth, isAuthenticated, requireRole, requireOrganizationRole, AuthError } from '../src/auth-helpers'
import { auth } from '../src/auth-server'

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns session when authenticated', async () => {
    const mockSession = { user: { id: 'u1', name: 'Test' }, session: { id: 's1' } }
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    const result = await requireAuth(new Request('http://localhost'))
    expect(result).toEqual(mockSession)
  })

  it('throws 401 when no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any)
    await expect(requireAuth(new Request('http://localhost'))).rejects.toThrow(AuthError)
    await expect(requireAuth(new Request('http://localhost'))).rejects.toThrow('Unauthorized')
  })
})

describe('isAuthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: 'u1' } } as any)
    expect(await isAuthenticated(new Request('http://localhost'))).toBe(true)
  })

  it('returns false when no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any)
    expect(await isAuthenticated(new Request('http://localhost'))).toBe(false)
  })

  it('returns false on error', async () => {
    vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Network error'))
    expect(await isAuthenticated(new Request('http://localhost'))).toBe(false)
  })
})

describe('requireRole', () => {
  it('does not throw for matching role', () => {
    expect(() => requireRole({ user: { role: 'admin' } }, 'admin')).not.toThrow()
  })

  it('throws 403 for wrong role', () => {
    expect(() => requireRole({ user: { role: 'member' } }, 'admin')).toThrow(AuthError)
    expect(() => requireRole({ user: { role: 'member' } }, 'admin')).toThrow('Forbidden')
  })

  it('throws 403 for missing role', () => {
    expect(() => requireRole({ user: {} }, 'admin')).toThrow(AuthError)
  })
})

describe('requireOrganizationRole', () => {
  it('allows owner when admin required', () => {
    expect(() => requireOrganizationRole(
      { user: { id: 'u1' } },
      { role: 'owner' },
      'admin'
    )).not.toThrow()
  })

  it('allows admin when admin required', () => {
    expect(() => requireOrganizationRole(
      { user: { id: 'u1' } },
      { role: 'admin' },
      'admin'
    )).not.toThrow()
  })

  it('allows owner when member required', () => {
    expect(() => requireOrganizationRole(
      { user: { id: 'u1' } },
      { role: 'owner' },
      'member'
    )).not.toThrow()
  })

  it('throws when not member', () => {
    expect(() => requireOrganizationRole(
      { user: { id: 'u1' } },
      null,
      'member'
    )).toThrow('Not a member')
  })

  it('throws when insufficient role', () => {
    expect(() => requireOrganizationRole(
      { user: { id: 'u1' } },
      { role: 'member' },
      'admin'
    )).toThrow('Insufficient')
  })
})
