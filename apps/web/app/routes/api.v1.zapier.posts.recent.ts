import type { Route } from './+types/api.v1.zapier.posts.recent'
import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'

export async function loader({ request }: Route.LoaderArgs) {
  const { userId, apiKey } = await requireApiKey(request)
  checkRateLimit(apiKey.id, apiKey.rateLimit)

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId },
    select: { id: true },
  })

  const posts = await prisma.socialPost.findMany({
    where: {
      socialAccountId: { in: socialAccounts.map((a) => a.id) },
      createdAt: { gte: oneHourAgo },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      content: true,
      mediaUrls: true,
      platform: true,
      scheduledAt: true,
      publishedAt: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return Response.json({ posts })
}
