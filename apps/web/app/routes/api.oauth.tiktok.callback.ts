// TikTok OAuth callback endpoint
// Handles OAuth callback and creates TikTok social account

import { timingSafeEqual } from 'node:crypto'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { TIKTOK_OAUTH_CONFIG } from '~/lib/tiktok-oauth-config'
import { fetchTikTokUserInfo } from '@creator-studio/social/tiktok-helpers'
import { encryptToken } from '~/lib/token-encryption'
import { checkRateLimit } from '~/lib/api-rate-limiter'
import { logger } from '~/lib/logger'

interface LoaderArgs {
  request: Request
}

export async function loader({ request }: LoaderArgs) {
  try {
    // Rate limit by IP — 10 requests/min per endpoint
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    await checkRateLimit(`oauth-tiktok:${clientIp}`, 10, 60)

    const session = await requireSession(request)

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
      .find((c) => c.trim().startsWith('tiktok_oauth_state='))
      ?.slice('tiktok_oauth_state='.length)

    if (!stateCookie || stateCookie.length !== returnedState.length) {
      return new Response('Invalid state parameter', { status: 400 })
    }

    try {
      const stateBuffer = Buffer.from(stateCookie)
      const returnedBuffer = Buffer.from(returnedState)

      if (!timingSafeEqual(stateBuffer, returnedBuffer)) {
        return new Response('Invalid state parameter', { status: 400 })
      }
    } catch {
      return new Response('Invalid state parameter', { status: 400 })
    }

    // Exchange code for access token
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/'
    const tokenBody = new URLSearchParams({
      client_key: TIKTOK_OAUTH_CONFIG.clientKey,
      client_secret: TIKTOK_OAUTH_CONFIG.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: TIKTOK_OAUTH_CONFIG.redirectUri,
    })

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json()
      logger.error({ err: error }, 'TikTok token exchange error')
      return new Response('Failed to exchange code for token', { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.data.access_token
    const refreshToken = tokenData.data.refresh_token
    const expiresIn = tokenData.data.expires_in

    // Fetch user info
    const userInfo = await fetchTikTokUserInfo(accessToken)

    // Check if account already exists
    const existing = await prisma.socialAccount.findFirst({
      where: {
        userId: session.user.id,
        platform: 'tiktok',
        platformUserId: userInfo.openId,
      },
    })

    if (existing) {
      // Update existing account
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptToken(accessToken),
          refreshToken: encryptToken(refreshToken),
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          username: userInfo.displayName,
          metadata: {
            openId: userInfo.openId,
            unionId: userInfo.unionId,
            avatarUrl: userInfo.avatarUrl,
          },
        },
      })
    } else {
      // Create new account
      await prisma.socialAccount.create({
        data: {
          userId: session.user.id,
          platform: 'tiktok',
          platformUserId: userInfo.openId,
          username: userInfo.displayName,
          accessToken: encryptToken(accessToken),
          refreshToken: encryptToken(refreshToken),
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          metadata: {
            openId: userInfo.openId,
            unionId: userInfo.unionId,
            avatarUrl: userInfo.avatarUrl,
          },
        },
      })
    }

    // Clear state cookie and redirect
    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      'tiktok_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/oauth; Max-Age=0'
    )
    headers.append('Location', '/dashboard/social')

    return new Response(null, {
      status: 302,
      headers,
    })
  } catch (error) {
    logger.error({ err: error }, 'TikTok OAuth callback error')
    return new Response('Failed to complete TikTok OAuth flow', { status: 500 })
  }
}
