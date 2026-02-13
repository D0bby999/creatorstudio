// API endpoint for connecting and disconnecting social media accounts
// Supports Bluesky (app password auth) and account disconnection

import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { BlueskyClient } from '@creator-studio/social/bluesky'
import type { Route } from './+types/api.social.connect'

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const action = formData.get('action')

  try {
    // Connect Bluesky account
    if (action === 'connectBluesky') {
      const handle = formData.get('handle')?.toString()
      const appPassword = formData.get('appPassword')?.toString()

      if (!handle || !appPassword) {
        return Response.json({ error: 'Handle and app password are required' }, { status: 400 })
      }

      // Validate credentials by creating session
      const client = new BlueskyClient(handle, appPassword)
      try {
        await client.createSession()
        const profile = await client.getUserProfile('')
        const tokenResult = await client.refreshToken()

        // Check if account already exists
        const existing = await prisma.socialAccount.findFirst({
          where: {
            userId: session.user.id,
            platform: 'bluesky',
            platformUserId: profile.id,
          },
        })

        if (existing) {
          return Response.json({ error: 'Account already connected' }, { status: 400 })
        }

        // Store account credentials
        await prisma.socialAccount.create({
          data: {
            userId: session.user.id,
            platform: 'bluesky',
            platformUserId: profile.id,
            username: profile.username,
            accessToken: tokenResult.accessToken,
            refreshToken: appPassword, // Store app password for future session creation
            expiresAt: new Date(Date.now() + tokenResult.expiresIn * 1000),
          },
        })

        return Response.json({ success: true, username: profile.username })
      } catch (err) {
        console.error('Bluesky auth error:', err)
        return Response.json({ error: 'Invalid credentials or authentication failed' }, { status: 401 })
      }
    }

    // Disconnect account
    if (action === 'disconnect') {
      const accountId = formData.get('accountId')?.toString()

      if (!accountId) {
        return Response.json({ error: 'Account ID is required' }, { status: 400 })
      }

      // Verify ownership before deleting
      const account = await prisma.socialAccount.findFirst({
        where: {
          id: accountId,
          userId: session.user.id,
        },
      })

      if (!account) {
        return Response.json({ error: 'Account not found' }, { status: 404 })
      }

      await prisma.socialAccount.delete({
        where: { id: accountId },
      })

      return Response.json({ success: true })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Social connect error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
