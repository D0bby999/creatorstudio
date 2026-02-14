// TikTok OAuth authorization endpoint
// Initiates OAuth flow for TikTok Content Posting API

import { requireSession } from '~/lib/auth-server'
import { buildTikTokAuthUrl } from '~/lib/tiktok-oauth-config'
import { randomBytes } from 'node:crypto'

interface LoaderArgs {
  request: Request
}

export async function loader({ request }: LoaderArgs) {
  try {
    // Require user to be logged in
    await requireSession(request)

    // Generate random state for CSRF protection
    const state = randomBytes(16).toString('hex')

    // Store state in cookie for validation on callback
    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      `tiktok_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api/oauth; Max-Age=600`
    )

    // Build TikTok OAuth URL and redirect
    const authUrl = buildTikTokAuthUrl(state)
    headers.append('Location', authUrl)

    return new Response(null, {
      status: 302,
      headers,
    })
  } catch (error) {
    console.error('TikTok OAuth authorize error:', error)
    return new Response('Failed to initiate TikTok OAuth flow', { status: 500 })
  }
}
