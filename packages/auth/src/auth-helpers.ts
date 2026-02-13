import { auth } from './auth-server'

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function requireAuth(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    throw new AuthError('Unauthorized', 401)
  }
  return session
}

export async function isAuthenticated(request: Request): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    return !!session
  } catch {
    return false
  }
}

export function requireRole(session: { user: { role?: string } }, role: string): void {
  if (session.user.role !== role) {
    throw new AuthError('Forbidden', 403)
  }
}

export function requireOrganizationRole(
  session: { user: { id: string } },
  orgMembership: { role: string } | null,
  requiredRole: string
): void {
  if (!orgMembership) {
    throw new AuthError('Not a member of this organization', 403)
  }
  const roleHierarchy = ['member', 'admin', 'owner']
  const requiredLevel = roleHierarchy.indexOf(requiredRole)
  const actualLevel = roleHierarchy.indexOf(orgMembership.role)
  if (actualLevel < requiredLevel) {
    throw new AuthError('Insufficient organization role', 403)
  }
}
