// Inngest serve endpoint for Creator Studio
// Handles function registration and invocation from Inngest platform

import type { Route } from './+types/api.inngest'
import { serve } from 'inngest/remix'
import { inngest } from '~/lib/inngest/inngest-client'
import { functions } from '~/lib/inngest/inngest-functions'

/**
 * Inngest serve handler
 * - GET: Health check and function registration
 * - POST: Function invocation from Inngest platform
 * - PUT: Signature verification
 */
const handler = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
})

/**
 * GET handler for Inngest health check and registration
 */
export async function loader({ request }: Route.LoaderArgs) {
  return handler(request)
}

/**
 * POST handler for Inngest function invocations
 */
export async function action({ request }: Route.ActionArgs) {
  return handler(request)
}
