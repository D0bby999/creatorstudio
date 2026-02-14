import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  const { apiKey } = await requireApiKey(request, ['plugins:read'])
  checkRateLimit(apiKey.id, apiKey.rateLimit)

  const plugin = await prisma.plugin.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      displayName: true,
      version: true,
      description: true,
      author: true,
      iconUrl: true,
      manifest: true,
      sourceUrl: true,
      installCount: true,
      status: true,
      updatedAt: true,
    },
  })

  if (!plugin) {
    return Response.json({ error: 'Plugin not found' }, { status: 404 })
  }

  return Response.json({ plugin })
}

export async function action({ params, request }: { params: { id: string }; request: Request }) {
  const { userId, apiKey } = await requireApiKey(request, ['plugins:write'])
  checkRateLimit(apiKey.id, apiKey.rateLimit)

  const body = await request.json()
  const { action: actionType, config } = body

  const plugin = await prisma.plugin.findUnique({
    where: { id: params.id },
  })

  if (!plugin) {
    return Response.json({ error: 'Plugin not found' }, { status: 404 })
  }

  switch (actionType) {
    case 'install': {
      const existing = await prisma.plugin.findUnique({
        where: { name_userId: { name: plugin.name, userId } },
      })

      if (existing) {
        return Response.json({ error: 'Plugin already installed' }, { status: 409 })
      }

      const [installed] = await prisma.$transaction([
        prisma.plugin.create({
          data: {
            name: plugin.name,
            displayName: plugin.displayName,
            version: plugin.version,
            description: plugin.description,
            author: plugin.author,
            iconUrl: plugin.iconUrl,
            manifest: plugin.manifest || undefined,
            sourceUrl: plugin.sourceUrl,
            status: 'approved',
            enabled: false,
            config: config || undefined,
            userId,
          },
        }),
        prisma.plugin.update({
          where: { id: params.id },
          data: { installCount: { increment: 1 } },
        }),
      ])

      return Response.json({ plugin: installed })
    }

    case 'uninstall': {
      const userPlugin = await prisma.plugin.findUnique({
        where: { name_userId: { name: plugin.name, userId } },
      })

      if (!userPlugin) {
        return Response.json({ error: 'Plugin not installed' }, { status: 404 })
      }

      await prisma.plugin.delete({ where: { id: userPlugin.id } })

      return Response.json({ success: true })
    }

    case 'approve':
    case 'reject': {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organizationMembers: true },
      })

      const isAdmin = user?.organizationMembers.some((m) => m.role === 'admin' || m.role === 'owner')

      if (!isAdmin) {
        return Response.json({ error: 'Admin access required' }, { status: 403 })
      }

      const updated = await prisma.plugin.update({
        where: { id: params.id },
        data: { status: actionType === 'approve' ? 'approved' : 'rejected' },
      })

      return Response.json({ plugin: updated })
    }

    default:
      return Response.json({ error: 'Invalid action' }, { status: 400 })
  }
}
