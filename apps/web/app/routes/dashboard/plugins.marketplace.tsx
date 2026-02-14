import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { Search } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Badge } from '@creator-studio/ui/components/badge'
import { PageHeader } from '@creator-studio/ui/components/composites/page-header'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { MarketplacePluginCard } from '~/components/marketplace-plugin-card'

export async function loader({ request }: { request: Request }) {
  const session = await requireSession(request)
  const url = new URL(request.url)

  const q = url.searchParams.get('q') || ''
  const category = url.searchParams.get('category') || ''
  const sort = url.searchParams.get('sort') || 'popular'

  const where = {
    status: 'approved',
    userId: null,
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
  if (sort === 'newest') orderBy = { updatedAt: 'desc' }
  else if (sort === 'rating') orderBy = { avgRating: 'desc' }

  const [plugins, categories, installedPlugins] = await Promise.all([
    prisma.plugin.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
      orderBy,
      take: 50,
    }),
    prisma.pluginCategory.findMany({
      select: { id: true, slug: true, name: true, icon: true },
      orderBy: { name: 'asc' },
    }),
    prisma.plugin.findMany({
      where: { userId: session.user.id },
      select: { name: true },
    }),
  ])

  return {
    plugins,
    categories,
    installedPluginNames: installedPlugins.map((p) => p.name),
    searchQuery: q,
    selectedCategory: category,
    selectedSort: sort,
  }
}

export default function PluginsMarketplace() {
  const { plugins, categories, installedPluginNames, searchQuery, selectedCategory, selectedSort } =
    useLoaderData<typeof loader>()
  const [search, setSearch] = useState(searchQuery)

  return (
    <div className="p-6">
      <PageHeader
        title="Plugin Marketplace"
        description="Discover and install plugins to extend Creator Studio"
        className="mb-6"
      >
        <Link to="/dashboard/plugins/installed">
          <Button variant="outline">Manage Installed</Button>
        </Link>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <form method="get" className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            name="q"
            placeholder="Search plugins..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-10"
          />
        </form>

        <select
          name="sort"
          defaultValue={selectedSort}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set('sort', e.target.value)
            window.location.href = url.toString()
          }}
          className="rounded-md border px-3 py-2"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <Link to="?">
          <Badge variant={!selectedCategory ? 'default' : 'outline'}>All</Badge>
        </Link>
        {categories.map((cat) => (
          <Link key={cat.id} to={`?category=${cat.slug}`}>
            <Badge variant={selectedCategory === cat.slug ? 'default' : 'outline'}>
              {cat.icon} {cat.name}
            </Badge>
          </Link>
        ))}
      </div>

      {plugins.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No plugins found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <MarketplacePluginCard
              key={plugin.id}
              plugin={plugin}
              isInstalled={installedPluginNames.includes(plugin.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
