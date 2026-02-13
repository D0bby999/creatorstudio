import type { Route } from './+types/api.webhooks'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { randomBytes } from 'node:crypto'
import { signPayload, deliverWebhook } from '@creator-studio/webhooks'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      webhookEvents: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  const masked = endpoints.map((ep) => ({
    ...ep,
    secret: ep.secret.slice(0, 8) + '••••••••',
  }))

  return Response.json({ endpoints: masked })
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const body = await request.json()
  const { action, url, events, id, enabled } = body

  if (action === 'create') {
    if (!url || !events || !Array.isArray(events)) {
      return Response.json({ error: 'URL and events are required' }, { status: 400 })
    }

    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') {
        return Response.json({ error: 'Webhook URL must use HTTPS' }, { status: 400 })
      }
    } catch {
      return Response.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const secret = randomBytes(32).toString('hex')

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        url,
        events,
        secret,
        userId: session.user.id,
      },
    })

    return Response.json({ endpoint }, { status: 201 })
  }

  if (action === 'update') {
    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    const endpoint = await prisma.webhookEndpoint.updateMany({
      where: { id, userId: session.user.id },
      data: { enabled: enabled ?? true },
    })

    return Response.json({ success: true })
  }

  if (action === 'delete') {
    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.webhookEndpoint.deleteMany({
      where: { id, userId: session.user.id },
    })

    return Response.json({ success: true })
  }

  if (action === 'test') {
    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!endpoint) {
      return Response.json({ error: 'Endpoint not found' }, { status: 404 })
    }

    const payload = JSON.stringify({ event: 'webhook.test', data: { message: 'Test webhook delivery' }, timestamp: new Date().toISOString() })
    const signature = signPayload(payload, endpoint.secret)
    const event = await prisma.webhookEvent.create({
      data: { endpointId: endpoint.id, eventType: 'webhook.test', payload: JSON.parse(payload), signature, status: 'pending' },
    })
    deliverWebhook(event.id, prisma).catch(() => {})

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
