import type { PrismaClient } from '@creator-studio/db/client'
import { deliverWebhook } from './webhook-manager'

let intervalId: NodeJS.Timeout | null = null

export function startRetryScheduler(prisma: PrismaClient): void {
  if (intervalId) return

  intervalId = setInterval(async () => {
    const now = new Date()
    const events = await prisma.webhookEvent.findMany({
      where: {
        status: 'pending',
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: now } },
        ],
      },
      take: 10,
    })

    const retryable = events.filter((e) => e.attempts < e.maxAttempts)

    for (const event of retryable) {
      deliverWebhook(event.id, prisma).catch(() => {})
    }
  }, 30000)
}

export function stopRetryScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
