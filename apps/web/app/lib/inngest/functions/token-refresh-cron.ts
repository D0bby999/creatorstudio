// Inngest cron: proactively refresh social tokens expiring within 24h
// Runs every 6 hours — belt-and-suspenders with on-demand 401 fallback in publisher

import { inngest } from '../inngest-client'
import { refreshExpiringTokens } from '@creator-studio/social/token-lifecycle'

export const tokenRefreshCron = inngest.createFunction(
  {
    id: 'token-refresh-cron',
    name: 'Refresh Expiring Social Tokens',
  },
  { cron: '0 */6 * * *' },
  async ({ step }) => {
    const report = await step.run('refresh-expiring-tokens', async () => {
      return refreshExpiringTokens()
    })

    if (report.errors.length > 0) {
      await step.run('log-failures', async () => {
        console.error(
          `Token refresh: ${report.refreshed} succeeded, ${report.failed} failed`,
          report.errors.map((e) => `${e.platform}:${e.accountId}`).join(', ')
        )
      })
    }

    return {
      refreshed: report.refreshed,
      failed: report.failed,
    }
  }
)
