import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'
import { logger } from '~/lib/logger'

export async function loader({ request }: { request: Request }) {
  const { apiKey } = await requireApiKey(request, ['plugins:read'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  const url = new URL(request.url)
  const q = url.searchParams.get('q') || ''
  const category = url.searchParams.get('category') || ''
  const sort = url.searchParams.get('sort') || 'popular'
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const offset = (page - 1) * limit

  try {
    const where = {
      status: 'approved',
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { displayName: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
              { tags: { has: q } },
            ],
          }
        : {}),
      ...(category ? { category: { slug: category } } : {}),
    }

    let orderBy: Record<string, unknown> = { installCount: 'desc' }
    if (sort === 'newest') {
      orderBy = { updatedAt: 'desc' }
    } else if (sort === 'rating') {
      orderBy = { avgRating: 'desc' }
    }

    const [plugins, totalCount] = await Promise.all([
      prisma.plugin.findMany({
        where,
        select: {
          id: true,
          name: true,
          displayName: true,
          version: true,
          description: true,
          author: true,
          iconUrl: true,
          installCount: true,
          avgRating: true,
          featured: true,
          tags: true,
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          updatedAt: true,
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.plugin.count({ where }),
    ])

    return Response.json({
      plugins,
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch marketplace plugins')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
