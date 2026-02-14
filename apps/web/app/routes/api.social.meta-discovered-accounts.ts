// API endpoint to retrieve Meta discovered accounts from Redis
// Used by MetaPlatformPickerDialog after OAuth callback

import { requireSession } from '~/lib/auth-server'
import { cacheGet, cacheDel } from '@creator-studio/redis'

interface LoaderArgs {
  request: Request
}

export async function loader({ request }: LoaderArgs) {
  try {
    await requireSession(request)

    const cookieHeader = request.headers.get('Cookie') || ''
    const sessionId = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('meta_discovery_session='))
      ?.split('=')[1]
      ?.trim()

    if (!sessionId) {
      return Response.json({ accounts: [] })
    }

    const accounts = await cacheGet<unknown[]>(`meta:discover:${sessionId}`)

    if (!accounts) {
      return Response.json({ accounts: [] })
    }

    // Clean up after retrieval — one-time use
    await cacheDel(`meta:discover:${sessionId}`)

    return Response.json({ accounts })
  } catch {
    return Response.json({ accounts: [], error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
