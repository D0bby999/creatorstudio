import type { PrismaClient } from '@creator-studio/db/client'
import { signPayload } from './webhook-signer'
import { resolveAndValidateUrl } from '@creator-studio/utils/ssrf-validator'

export async function trigger(
  eventType: string,
  data: Record<string, unknown>,
  prisma: PrismaClient
): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { enabled: true, events: { has: eventType } },
  })

  for (const endpoint of endpoints) {
    const payload = JSON.stringify({ event: eventType, data, timestamp: new Date().toISOString() })
    const signature = signPayload(payload, endpoint.secret)

    await prisma.webhookEvent.create({
      data: {
        endpointId: endpoint.id,
        eventType,
        payload: { event: eventType, data, timestamp: new Date().toISOString() },
        signature,
        status: 'pending',
      },
    })
  }

  const pendingEvents = await prisma.webhookEvent.findMany({
    where: { status: 'pending', attempts: 0 },
    take: 10,
  })

  for (const event of pendingEvents) {
    deliverWebhook(event.id, prisma).catch(() => {})
  }
}

export async function deliverWebhook(eventId: string, prisma: PrismaClient): Promise<void> {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
    include: { endpoint: true },
  })

  if (!event || !event.endpoint.enabled) return

  try {
    await resolveAndValidateUrl(event.endpoint.url)
  } catch (error) {
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        attempts: { increment: 1 },
        lastError: 'SSRF validation failed: blocked IP or protocol',
        status: 'failed',
      },
    })
    return
  }

  const payload = JSON.stringify(event.payload)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(event.endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': event.signature,
        'X-Webhook-Event': event.eventType,
        'User-Agent': 'CreatorStudio-Webhooks/1.0',
      },
      body: payload,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.ok) {
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { status: 'delivered', deliveredAt: new Date() },
      })
    } else {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }
  } catch (error) {
    const attempts = event.attempts + 1
    const nextRetryDelay = Math.pow(2, attempts) * 5000
    const nextRetryAt = new Date(Date.now() + nextRetryDelay)

    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        attempts,
        lastError: error instanceof Error ? error.message : String(error),
        status: attempts >= event.maxAttempts ? 'failed' : 'pending',
        nextRetryAt: attempts >= event.maxAttempts ? null : nextRetryAt,
      },
    })
  }
}
