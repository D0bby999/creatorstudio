import { prisma } from '@creator-studio/db/client'

export interface MarketplaceFilters {
  searchQuery?: string
  category?: string
  sort?: 'popular' | 'newest' | 'rating'
  page?: number
  limit?: number
}

export async function getMarketplacePlugins(filters: MarketplaceFilters) {
  const { searchQuery = '', category = '', sort = 'popular', page = 1, limit = 50 } = filters

  const where = {
    status: 'approved',
    userId: null,
    ...(searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' as const } },
            { displayName: { contains: searchQuery, mode: 'insensitive' as const } },
            { description: { contains: searchQuery, mode: 'insensitive' as const } },
            { tags: { has: searchQuery } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
  }

  let orderBy: Record<string, unknown> = { installCount: 'desc' }
  if (sort === 'newest') orderBy = { updatedAt: 'desc' }
  else if (sort === 'rating') orderBy = { avgRating: 'desc' }

  const offset = (page - 1) * limit

  const [plugins, totalCount] = await Promise.all([
    prisma.plugin.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.plugin.count({ where }),
  ])

  return {
    plugins,
    pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) },
  }
}

export async function getPluginCategories() {
  return prisma.pluginCategory.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      _count: { select: { plugins: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getUserInstalledPlugins(userId: string) {
  const installed = await prisma.plugin.findMany({
    where: { userId },
    select: { name: true },
  })
  return installed.map((p) => p.name)
}

export async function trackPluginInstall(pluginId: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.pluginInstall.findUnique({
      where: { pluginId_userId: { pluginId, userId } },
    })

    if (existing && !existing.uninstalledAt) return

    await tx.pluginInstall.upsert({
      where: { pluginId_userId: { pluginId, userId } },
      create: { pluginId, userId, installedAt: new Date() },
      update: { uninstalledAt: null },
    })

    await tx.plugin.update({
      where: { id: pluginId },
      data: { installCount: { increment: 1 } },
    })
  })
}

export async function trackPluginUninstall(pluginId: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.pluginInstall.findUnique({
      where: { pluginId_userId: { pluginId, userId } },
    })

    if (!existing || existing.uninstalledAt) return

    await tx.pluginInstall.update({
      where: { pluginId_userId: { pluginId, userId } },
      data: { uninstalledAt: new Date() },
    })

    const plugin = await tx.plugin.findUnique({ where: { id: pluginId }, select: { installCount: true } })
    if (plugin && plugin.installCount > 0) {
      await tx.plugin.update({
        where: { id: pluginId },
        data: { installCount: { decrement: 1 } },
      })
    }
  })
}
