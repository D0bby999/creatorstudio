import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'
import { logger } from '~/lib/logger'

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  const { apiKey } = await requireApiKey(request, ['plugins:read'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const offset = (page - 1) * limit

  try {
    const [reviews, totalCount] = await Promise.all([
      prisma.pluginReview.findMany({
        where: { pluginId: params.id },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.pluginReview.count({ where: { pluginId: params.id } }),
    ])

    return Response.json({
      reviews,
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) },
    })
  } catch (error) {
    logger.error({ error, pluginId: params.id }, 'Failed to fetch plugin reviews')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function action({ params, request }: { params: { id: string }; request: Request }) {
  const { userId, apiKey } = await requireApiKey(request, ['plugins:write'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const body = await request.json()
    const { rating, comment } = body

    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const plugin = await prisma.plugin.findUnique({ where: { id: params.id } })
    if (!plugin) {
      return Response.json({ error: 'Plugin not found' }, { status: 404 })
    }

    const review = await prisma.pluginReview.upsert({
      where: {
        pluginId_userId: { pluginId: params.id, userId },
      },
      create: {
        pluginId: params.id,
        userId,
        rating,
        comment: comment || null,
      },
      update: {
        rating,
        comment: comment || null,
      },
    })

    const avgRating = await calculateAvgRating(params.id)
    await prisma.plugin.update({
      where: { id: params.id },
      data: { avgRating },
    })

    return Response.json({ review })
  } catch (error) {
    logger.error({ error, pluginId: params.id }, 'Failed to create/update review')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function calculateAvgRating(pluginId: string): Promise<number> {
  const result = await prisma.pluginReview.aggregate({
    where: { pluginId },
    _avg: { rating: true },
  })
  return result._avg.rating || 0
}
