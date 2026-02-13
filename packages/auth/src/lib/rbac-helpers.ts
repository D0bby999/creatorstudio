// Role-based access control helpers for organization resources
// Pure functions — caller provides role, helpers return boolean decisions

export type OrgRole = 'owner' | 'admin' | 'member'

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  member: 0,
  admin: 1,
  owner: 2,
}

export function hasMinRole(userRole: string, requiredRole: OrgRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as OrgRole]
  const requiredLevel = ROLE_HIERARCHY[requiredRole]
  if (userLevel === undefined || requiredLevel === undefined) return false
  return userLevel >= requiredLevel
}

// Any member can create resources within their org
export function canCreateResource(role: string): boolean {
  return hasMinRole(role, 'member')
}

// Admin+ can update any resource; member can update own only; unknown roles denied
export function canUpdateResource(role: string, isResourceOwner: boolean): boolean {
  if (!hasMinRole(role, 'member')) return false
  return hasMinRole(role, 'admin') || isResourceOwner
}

// Admin+ can delete any resource; member can delete own only; unknown roles denied
export function canDeleteResource(role: string, isResourceOwner: boolean): boolean {
  if (!hasMinRole(role, 'member')) return false
  return hasMinRole(role, 'admin') || isResourceOwner
}

// Admin+ can invite/remove members
export function canManageMembers(role: string): boolean {
  return hasMinRole(role, 'admin')
}

// Only owner can delete the organization
export function canDeleteOrganization(role: string): boolean {
  return role === 'owner'
}

// Only owner can change other members' roles
export function canChangeRole(role: string): boolean {
  return role === 'owner'
}
