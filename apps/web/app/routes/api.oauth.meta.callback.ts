// Meta OAuth callback endpoint
// Handles OAuth callback and discovers Instagram/Facebook/Threads accounts

import { requireSession } from '~/lib/auth-server'
import { META_OAUTH_CONFIG } from '~/lib/meta-oauth-config'
import { refreshLongLivedToken } from '@creator-studio/social/meta-helpers'
import { encryptToken } from '~/lib/token-encryption'
import { cacheSet } from '@creator-studio/redis'
import { logger } from '~/lib/logger'

interface LoaderArgs {
  request: Request
}

interface MetaAccount {
  id: string
  name: string
  access_token: string
}

interface MetaUserData {
  id: string
  instagram_business_account?: {
    id: string
  }
}

interface DiscoveredAccount {
  platform: 'facebook' | 'instagram' | 'threads'
  platformUserId: string
  name: string
  accessToken: string
  expiresIn: number
  pageId?: string
  pageAccessToken?: string
}

export async function loader({ request }: LoaderArgs) {
  try {
    await requireSession(request)

    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const returnedState = url.searchParams.get('state')

    if (!code || !returnedState) {
      return new Response('Missing code or state parameter', { status: 400 })
    }

    // Validate state from cookie
    const cookieHeader = request.headers.get('Cookie') || ''
    const stateCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('meta_oauth_state='))
      ?.split('=')[1]

    if (!stateCookie || stateCookie !== returnedState) {
      return new Response('Invalid state parameter', { status: 400 })
    }

    // Exchange code for short-lived access token
    const tokenUrl = 'https://graph.facebook.com/v22.0/oauth/access_token'
    const tokenParams = new URLSearchParams({
      client_id: META_OAUTH_CONFIG.clientId,
      client_secret: META_OAUTH_CONFIG.clientSecret,
      redirect_uri: META_OAUTH_CONFIG.redirectUri,
      code,
    })

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams}`)
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json()
      logger.error({ err: error }, 'Meta token exchange error')
      return new Response('Failed to exchange code for token', { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    const shortLivedToken = tokenData.access_token

    // Exchange for long-lived token (60-day)
    const longLivedResult = await refreshLongLivedToken(
      shortLivedToken,
      META_OAUTH_CONFIG.clientId,
      META_OAUTH_CONFIG.clientSecret
    )

    // Discover connected platforms (store encrypted tokens for security)
    const discoveredAccounts: DiscoveredAccount[] = []

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(longLivedResult.accessToken)

    // Get Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v22.0/me/accounts?access_token=${longLivedResult.accessToken}`
    )
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json()
      const pages: MetaAccount[] = pagesData.data || []
      for (const page of pages) {
        discoveredAccounts.push({
          platform: 'facebook',
          platformUserId: page.id,
          name: page.name,
          accessToken: encryptedAccessToken,
          pageAccessToken: encryptToken(page.access_token),
          expiresIn: longLivedResult.expiresIn,
        })

        // Check if page has Instagram business account
        const igResponse = await fetch(
          `https://graph.facebook.com/v22.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        )
        if (igResponse.ok) {
          const igData = await igResponse.json()
          if (igData.instagram_business_account) {
            const igAccountId = igData.instagram_business_account.id

            // Get Instagram username
            const igProfileResponse = await fetch(
              `https://graph.facebook.com/v22.0/${igAccountId}?fields=username&access_token=${page.access_token}`
            )
            if (igProfileResponse.ok) {
              const igProfile = await igProfileResponse.json()
              discoveredAccounts.push({
                platform: 'instagram',
                platformUserId: igAccountId,
                name: igProfile.username,
                accessToken: encryptedAccessToken,
                pageId: page.id,
                pageAccessToken: encryptToken(page.access_token),
                expiresIn: longLivedResult.expiresIn,
              })
            }
          }
        }
      }
    }

    // Check for Threads access (requires threads_basic scope)
    const threadsResponse = await fetch(
      `https://graph.facebook.com/v22.0/me?fields=threads_publishing_limit&access_token=${longLivedResult.accessToken}`
    )
    if (threadsResponse.ok) {
      const threadsData = await threadsResponse.json()
      if (threadsData.threads_publishing_limit) {
        // User has Threads access
        const meResponse = await fetch(
          `https://graph.facebook.com/v22.0/me?access_token=${longLivedResult.accessToken}`
        )
        if (meResponse.ok) {
          const meData: MetaUserData = await meResponse.json()
          discoveredAccounts.push({
            platform: 'threads',
            platformUserId: meData.id,
            name: 'Threads',
            accessToken: encryptedAccessToken,
            expiresIn: longLivedResult.expiresIn,
          })
        }
      }
    }

    // Store encrypted accounts in Redis (not cookie) for security
    // Generate random session ID to reference the cached data
    const discoverySessionId = crypto.randomUUID()
    await cacheSet(
      `meta:discover:${discoverySessionId}`,
      JSON.stringify(discoveredAccounts),
      300 // 5 min TTL
    )

    // Store only the session ID in cookie (not the tokens)
    // NOTE: Picker dialog route must read from Redis using this session ID
    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      `meta_discovery_session=${discoverySessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=300`
    )
    headers.append(
      'Set-Cookie',
      'meta_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/oauth; Max-Age=0'
    )
    headers.append('Location', '/dashboard/social?meta_setup=1')

    return new Response(null, {
      status: 302,
      headers,
    })
  } catch (error) {
    logger.error({ err: error }, 'Meta OAuth callback error')
    return new Response('Failed to complete Meta OAuth flow', { status: 500 })
  }
}
