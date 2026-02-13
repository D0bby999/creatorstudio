import type { Route } from './+types/api.v1.auth.verify'
import { requireApiKey } from '~/lib/api-key-auth'

export async function loader({ request }: Route.LoaderArgs) {
  const { userId, apiKey } = await requireApiKey(request)

  return Response.json({
    authenticated: true,
    userId,
    scopes: apiKey.scopes,
    rateLimit: apiKey.rateLimit,
  })
}
