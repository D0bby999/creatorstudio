import type { Route } from './+types/api.api-keys'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { randomBytes } from 'node:crypto'
import { hashApiKey } from '~/lib/api-key-auth'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      rateLimit: true,
      scopes: true,
      enabled: true,
      createdAt: true,
      expiresAt: true,
    },
  })

  return Response.json({ apiKeys })
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const body = await request.json()
  const { action, name, id } = body

  if (action === 'create') {
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    const rawKey = `cs_live_${randomBytes(32).toString('hex')}`
    const hashedKey = hashApiKey(rawKey)

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        userId: session.user.id,
      },
    })

    return Response.json({ apiKey: { id: apiKey.id, name: apiKey.name, key: rawKey } }, { status: 201 })
  }

  if (action === 'delete') {
    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.apiKey.updateMany({
      where: { id, userId: session.user.id },
      data: { enabled: false },
    })

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
