import { auth } from '@creator-studio/auth/server'

export { auth }

export async function getSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  return session
}

export async function requireSession(request: Request) {
  const session = await getSession(request)
  if (!session) {
    throw new Response(null, {
      status: 302,
      headers: { Location: '/sign-in' },
    })
  }
  return session
}
