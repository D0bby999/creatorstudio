import { auth } from '@creator-studio/auth/server'

export { auth }

export async function getSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  return session
}

export async function requireSession(request: Request) {
  const session = await getSession(request)
  if (!session) {
    const returnTo = new URL(request.url).pathname
    const params = returnTo !== '/dashboard' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
    throw new Response(null, {
      status: 302,
      headers: { Location: `/sign-in${params}` },
    })
  }
  return session
}

export async function requireApiSession(request: Request) {
  const session = await getSession(request)
  if (!session) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
  return session
}
