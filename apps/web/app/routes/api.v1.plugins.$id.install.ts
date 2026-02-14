import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'
import { logger } from '~/lib/logger'

export async function action({ params, request }: { params: { id: string }; request: Request }) {
  const { userId, apiKey } = await requireApiKey(request, ['plugins:write'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  const pluginId = params.id

  try {
    const plugin = await prisma.plugin.findUnique({ where: { id: pluginId } })
    if (!plugin) {
      return Response.json({ error: 'Plugin not found' }, { status: 404 })
    }

    if (request.method === 'POST') {
      const install = await prisma.$transaction(async (tx) => {
        const existing = await tx.pluginInstall.findUnique({
          where: { pluginId_userId: { pluginId, userId } },
        })

        if (existing && !existing.uninstalledAt) {
          return existing // Already installed, no-op
        }

        const record = await tx.pluginInstall.upsert({
          where: { pluginId_userId: { pluginId, userId } },
          create: { pluginId, userId, installedAt: new Date() },
          update: { uninstalledAt: null },
        })

        await tx.plugin.update({
          where: { id: pluginId },
          data: { installCount: { increment: 1 } },
        })

        return record
      })

      return Response.json({ install })
    } else if (request.method === 'DELETE') {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.pluginInstall.findUnique({
          where: { pluginId_userId: { pluginId, userId } },
        })

        if (!existing || existing.uninstalledAt) {
          throw new Response(JSON.stringify({ error: 'Plugin not installed' }), { status: 404 })
        }

        await tx.pluginInstall.update({
          where: { pluginId_userId: { pluginId, userId } },
          data: { uninstalledAt: new Date() },
        })

        await tx.plugin.update({
          where: { id: pluginId },
          data: { installCount: { decrement: 1 } },
        })
      })

      return Response.json({ success: true })
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (error) {
    if (error instanceof Response) throw error
    logger.error({ error, pluginId }, 'Failed to track plugin install/uninstall')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
