import { describe, it, expect } from 'vitest'
import {
  hasMinRole,
  canCreateResource,
  canUpdateResource,
  canDeleteResource,
  canManageMembers,
  canDeleteOrganization,
  canChangeRole,
  type OrgRole,
} from '../src/lib/rbac-helpers'

describe('RBAC Helpers', () => {
  describe('hasMinRole', () => {
    it('returns true for owner when any role required', () => {
      expect(hasMinRole('owner', 'owner')).toBe(true)
      expect(hasMinRole('owner', 'admin')).toBe(true)
      expect(hasMinRole('owner', 'member')).toBe(true)
    })

    it('returns true for admin when admin or member required', () => {
      expect(hasMinRole('admin', 'admin')).toBe(true)
      expect(hasMinRole('admin', 'member')).toBe(true)
    })

    it('returns false for admin when owner required', () => {
      expect(hasMinRole('admin', 'owner')).toBe(false)
    })

    it('returns true for member when member required', () => {
      expect(hasMinRole('member', 'member')).toBe(true)
    })

    it('returns false for member when admin or owner required', () => {
      expect(hasMinRole('member', 'admin')).toBe(false)
      expect(hasMinRole('member', 'owner')).toBe(false)
    })

    it('returns false for invalid role', () => {
      expect(hasMinRole('invalid', 'member')).toBe(false)
      expect(hasMinRole('owner', 'invalid' as OrgRole)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(hasMinRole('', 'member')).toBe(false)
    })

    it('returns false for undefined role', () => {
      expect(hasMinRole(undefined as any, 'member')).toBe(false)
    })
  })

  describe('canCreateResource', () => {
    it('allows owner to create', () => {
      expect(canCreateResource('owner')).toBe(true)
    })

    it('allows admin to create', () => {
      expect(canCreateResource('admin')).toBe(true)
    })

    it('allows member to create', () => {
      expect(canCreateResource('member')).toBe(true)
    })

    it('denies invalid role', () => {
      expect(canCreateResource('invalid')).toBe(false)
    })

    it('denies empty string', () => {
      expect(canCreateResource('')).toBe(false)
    })
  })

  describe('canUpdateResource', () => {
    it('allows owner to update any resource', () => {
      expect(canUpdateResource('owner', false)).toBe(true)
      expect(canUpdateResource('owner', true)).toBe(true)
    })

    it('allows admin to update any resource', () => {
      expect(canUpdateResource('admin', false)).toBe(true)
      expect(canUpdateResource('admin', true)).toBe(true)
    })

    it('allows member to update only own resource', () => {
      expect(canUpdateResource('member', true)).toBe(true)
      expect(canUpdateResource('member', false)).toBe(false)
    })

    it('denies invalid role', () => {
      expect(canUpdateResource('invalid', true)).toBe(false)
      expect(canUpdateResource('invalid', false)).toBe(false)
    })

    it('denies empty string', () => {
      expect(canUpdateResource('', true)).toBe(false)
      expect(canUpdateResource('', false)).toBe(false)
    })
  })

  describe('canDeleteResource', () => {
    it('allows owner to delete any resource', () => {
      expect(canDeleteResource('owner', false)).toBe(true)
      expect(canDeleteResource('owner', true)).toBe(true)
    })

    it('allows admin to delete any resource', () => {
      expect(canDeleteResource('admin', false)).toBe(true)
      expect(canDeleteResource('admin', true)).toBe(true)
    })

    it('allows member to delete only own resource', () => {
      expect(canDeleteResource('member', true)).toBe(true)
      expect(canDeleteResource('member', false)).toBe(false)
    })

    it('denies invalid role', () => {
      expect(canDeleteResource('invalid', true)).toBe(false)
      expect(canDeleteResource('invalid', false)).toBe(false)
    })

    it('denies empty string', () => {
      expect(canDeleteResource('', true)).toBe(false)
      expect(canDeleteResource('', false)).toBe(false)
    })
  })

  describe('canManageMembers', () => {
    it('allows owner to manage members', () => {
      expect(canManageMembers('owner')).toBe(true)
    })

    it('allows admin to manage members', () => {
      expect(canManageMembers('admin')).toBe(true)
    })

    it('denies member from managing members', () => {
      expect(canManageMembers('member')).toBe(false)
    })

    it('denies invalid role', () => {
      expect(canManageMembers('invalid')).toBe(false)
    })

    it('denies empty string', () => {
      expect(canManageMembers('')).toBe(false)
    })
  })

  describe('canDeleteOrganization', () => {
    it('allows owner only', () => {
      expect(canDeleteOrganization('owner')).toBe(true)
    })

    it('denies admin', () => {
      expect(canDeleteOrganization('admin')).toBe(false)
    })

    it('denies member', () => {
      expect(canDeleteOrganization('member')).toBe(false)
    })

    it('denies invalid role', () => {
      expect(canDeleteOrganization('invalid')).toBe(false)
    })

    it('denies empty string', () => {
      expect(canDeleteOrganization('')).toBe(false)
    })
  })

  describe('canChangeRole', () => {
    it('allows owner only', () => {
      expect(canChangeRole('owner')).toBe(true)
    })

    it('denies admin', () => {
      expect(canChangeRole('admin')).toBe(false)
    })

    it('denies member', () => {
      expect(canChangeRole('member')).toBe(false)
    })

    it('denies invalid role', () => {
      expect(canChangeRole('invalid')).toBe(false)
    })

    it('denies empty string', () => {
      expect(canChangeRole('')).toBe(false)
    })
  })
})
