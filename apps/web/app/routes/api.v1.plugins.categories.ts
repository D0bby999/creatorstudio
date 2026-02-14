import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'
import { logger } from '~/lib/logger'

export async function loader({ request }: { request: Request }) {
  const { apiKey } = await requireApiKey(request, ['plugins:read'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  try {
    const categories = await prisma.pluginCategory.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        icon: true,
        _count: {
          select: { plugins: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return Response.json({ categories })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch plugin categories')
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Seed plugin categories:
 *
 * await prisma.pluginCategory.createMany({
 *   data: [
 *     { slug: 'social', name: 'Social Media', icon: '📱' },
 *     { slug: 'analytics', name: 'Analytics', icon: '📊' },
 *     { slug: 'ai', name: 'AI & Automation', icon: '🤖' },
 *     { slug: 'video', name: 'Video Editing', icon: '🎬' },
 *     { slug: 'design', name: 'Design Tools', icon: '🎨' },
 *     { slug: 'seo', name: 'SEO & Marketing', icon: '🔍' },
 *     { slug: 'productivity', name: 'Productivity', icon: '⚡' },
 *     { slug: 'storage', name: 'Storage & Backup', icon: '💾' },
 *   ],
 *   skipDuplicates: true,
 * })
 */
