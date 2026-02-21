// Proactive token refresh: finds expiring tokens and refreshes before publish failures
// Used by Inngest cron (every 6h) and on-demand 401 fallback in publisher

import { prisma } from '@creator-studio/db/client'
import { getPlatformClient } from './platform-factory'
import { createSafeErrorMessage } from './error-sanitizer'
import type { SocialPlatform } from '../types/social-types'

const EXPIRY_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface TokenRefreshReport {
  refreshed: number
  failed: number
  errors: Array<{ accountId: string; platform: string; error: string }>
}

// Find accounts with tokens expiring within 24h (but not already expired)
export async function checkExpiringTokens() {
  const now = new Date()
  const cutoff = new Date(now.getTime() + EXPIRY_WINDOW_MS)

  return prisma.socialAccount.findMany({
    where: {
      expiresAt: {
        gt: now,
        lte: cutoff,
      },
    },
    select: {
      id: true,
      platform: true,
      username: true,
      accessToken: true,
      metadata: true,
    },
  })
}

// Refresh a single account's token via platform client
export async function refreshAccountToken(accountId: string): Promise<void> {
  const account = await prisma.socialAccount.findUniqueOrThrow({
    where: { id: accountId },
  })

  const metadata = account.metadata as Record<string, string> | null
  const client = getPlatformClient(
    account.platform as SocialPlatform,
    account.accessToken,
    metadata ? {
      handle: metadata.handle,
      appPassword: metadata.appPassword,
      pageId: metadata.pageId,
      pageAccessToken: metadata.pageAccessToken,
      openId: metadata.openId,
      clientKey: metadata.clientKey,
      clientSecret: metadata.clientSecret,
      refreshToken: metadata.refreshToken,
      appId: metadata.appId,
      appSecret: metadata.appSecret,
    } : undefined
  )

  const result = await client.refreshToken()

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: result.accessToken,
      expiresAt: new Date(Date.now() + result.expiresIn * 1000),
      tokenRefreshedAt: new Date(),
    },
  })
}

// Batch refresh all expiring tokens — used by Inngest cron
export async function refreshExpiringTokens(): Promise<TokenRefreshReport> {
  const expiring = await checkExpiringTokens()
  const report: TokenRefreshReport = { refreshed: 0, failed: 0, errors: [] }

  for (const account of expiring) {
    try {
      await refreshAccountToken(account.id)
      report.refreshed++
    } catch (error) {
      report.failed++
      report.errors.push({
        accountId: account.id,
        platform: account.platform,
        error: createSafeErrorMessage('Token refresh failed', error),
      })
    }
  }

  return report
}
