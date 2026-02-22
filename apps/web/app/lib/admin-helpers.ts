import { requireSession } from './auth-server'

export async function requireAdmin(request: Request) {
  const session = await requireSession(request)

  if (session.user.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 })
  }

  return session
}
