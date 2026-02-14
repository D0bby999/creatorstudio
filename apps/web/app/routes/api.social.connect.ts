// API endpoint for connecting and disconnecting social media accounts
// Supports Bluesky (app password auth) and account disconnection

import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { BlueskyClient } from '@creator-studio/social/bluesky'
import { encryptToken } from '~/lib/token-encryption'
import { logger } from '~/lib/logger'
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
        logger.error({ err }, 'Bluesky auth error')
        return Response.json({ error: 'Invalid credentials or authentication failed' }, { status: 401 })
      }
    }

    // Connect Meta accounts (Instagram/Facebook/Threads)
    if (action === 'connectMeta') {
      const accountsJson = formData.get('accounts')?.toString()

      if (!accountsJson) {
        return Response.json({ error: 'Accounts data is required' }, { status: 400 })
      }

      try {
        const accounts = JSON.parse(accountsJson)

        for (const account of accounts) {
          // Check if account already exists
          const existing = await prisma.socialAccount.findFirst({
            where: {
              userId: session.user.id,
              platform: account.platform,
              platformUserId: account.platformUserId,
            },
          })

          if (existing) {
            // Update existing account
            await prisma.socialAccount.update({
              where: { id: existing.id },
              data: {
                accessToken: encryptToken(account.accessToken),
                expiresAt: new Date(Date.now() + account.expiresIn * 1000),
                username: account.name,
                metadata: {
                  pageId: account.pageId,
                  pageAccessToken: account.pageAccessToken ? encryptToken(account.pageAccessToken) : undefined,
                },
              },
            })
          } else {
            // Create new account
            await prisma.socialAccount.create({
              data: {
                userId: session.user.id,
                platform: account.platform,
                platformUserId: account.platformUserId,
                username: account.name,
                accessToken: encryptToken(account.accessToken),
                expiresAt: new Date(Date.now() + account.expiresIn * 1000),
                metadata: {
                  pageId: account.pageId,
                  pageAccessToken: account.pageAccessToken ? encryptToken(account.pageAccessToken) : undefined,
                },
              },
            })
          }
        }

        return Response.json({ success: true })
      } catch (err) {
        logger.error({ err }, 'Meta connect error')
        return Response.json({ error: 'Failed to connect Meta accounts' }, { status: 500 })
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
    logger.error({ err: error }, 'Social connect error')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
