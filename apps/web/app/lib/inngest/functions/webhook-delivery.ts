// Inngest function for delivering webhook events with automatic retries
// Replaces setInterval-based retry scheduler

import { inngest } from '../inngest-client'
import { prisma } from '@creator-studio/db/client'

/**
 * Event payload for webhook delivery
 */
interface WebhookEventCreatedEvent {
  data: {
    eventId: string
  }
}

/**
 * Delivers webhook event to registered endpoint
 * Inngest handles automatic retries with exponential backoff
 */
export const webhookDelivery = inngest.createFunction(
  {
    id: 'deliver-webhook',
    name: 'Deliver Webhook Event',
    retries: 3,
  },
  { event: 'webhook/event.created' },
  async ({ event, step }) => {
    const { eventId } = event.data as WebhookEventCreatedEvent['data']

    // Step 1: Load webhook event from database
    const webhookEvent = await step.run('load-webhook-event', async () => {
      const result = await prisma.webhookEvent.findUnique({
        where: { id: eventId },
        include: { endpoint: true },
      })

      if (!result) {
        throw new Error(`Webhook event not found: ${eventId}`)
      }

      if (!result.endpoint.enabled) {
        throw new Error(`Endpoint disabled: ${result.endpoint.id}`)
      }

      return result
    })

    // Step 2: Update attempt counter
    await step.run('increment-attempts', async () => {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { attempts: webhookEvent.attempts + 1 },
      })
    })

    // Step 3: Deliver webhook via HTTP POST
    const response = await step.run('post-to-endpoint', async () => {
      const payload = JSON.stringify(webhookEvent.payload)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      try {
        const res = await fetch(webhookEvent.endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': webhookEvent.signature,
            'X-Webhook-Event': webhookEvent.eventType,
            'User-Agent': 'CreatorStudio-Webhooks/1.0',
          },
          body: payload,
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`HTTP ${res.status}: ${errorText}`)
        }

        return {
          status: res.status,
          ok: true,
        }
      } catch (error) {
        clearTimeout(timeout)
        throw error
      }
    })

    // Step 4: Update delivery status
    await step.run('mark-delivered', async () => {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'delivered',
          deliveredAt: new Date(),
        },
      })
    })

    return {
      eventId,
      status: 'delivered',
      httpStatus: response.status,
      deliveredAt: new Date().toISOString(),
    }
  }
)
