import { prisma } from '@creator-studio/db/client'

export async function calculatePluginAvgRating(pluginId: string): Promise<number> {
  const result = await prisma.pluginReview.aggregate({
    where: { pluginId },
    _avg: { rating: true },
  })
  return result._avg.rating || 0
}

export async function createOrUpdateReview(pluginId: string, userId: string, rating: number, comment?: string) {
  const review = await prisma.pluginReview.upsert({
    where: { pluginId_userId: { pluginId, userId } },
    create: { pluginId, userId, rating, comment: comment || null },
    update: { rating, comment: comment || null },
  })

  const avgRating = await calculatePluginAvgRating(pluginId)
  await prisma.plugin.update({
    where: { id: pluginId },
    data: { avgRating },
  })

  return review
}

export async function getPluginReviews(pluginId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit

  const [reviews, totalCount] = await Promise.all([
    prisma.pluginReview.findMany({
      where: { pluginId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.pluginReview.count({ where: { pluginId } }),
  ])

  return {
    reviews,
    pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) },
  }
}
