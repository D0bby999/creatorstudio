import type { PrismaClient } from '@creator-studio/db/client'
import { deliverWebhook } from './webhook-manager'

let intervalId: NodeJS.Timeout | null = null

/**
 * Send webhook event to Inngest for delivery
 * Replaces setInterval-based retry pattern for serverless deployments
 */
export async function sendWebhookEvent(eventId: string): Promise<void> {
  // Skip if INNGEST_EVENT_KEY not configured
  if (!process.env.INNGEST_EVENT_KEY) {
    console.warn('INNGEST_EVENT_KEY not set, skipping Inngest event send')
    return
  }

  try {
    const response = await fetch('https://inn.gs/e/creator-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INNGEST_EVENT_KEY}`,
      },
      body: JSON.stringify({
        name: 'webhook/event.created',
        data: { eventId },
      }),
    })

    if (!response.ok) {
      throw new Error(`Inngest API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to send Inngest event:', error)
    throw error
  }
}

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
