import type { Route } from './+types/api.v1.zapier.exports.recent'
import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'

export async function loader({ request }: Route.LoaderArgs) {
  const { userId, apiKey } = await requireApiKey(request)
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const exports = await prisma.project.findMany({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
      type: { in: ['canvas', 'video'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      type: true,
      thumbnail: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return Response.json({ exports })
}
