import { useState } from 'react'
import { useFetcher, Link } from 'react-router'
import { Puzzle, Search } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { PageHeader } from '@creator-studio/ui/components/composites/page-header'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { PluginCard } from '~/components/plugin-card'
import type { Route } from './+types/plugins'

export async function loader({ request }: { request: Request }) {
  const session = await requireSession(request)

  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''

  const where = {
    status: 'approved',
    userId: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { author: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [approvedPlugins, installedPlugins] = await Promise.all([
    prisma.plugin.findMany({
      where,
      orderBy: { installCount: 'desc' },
      take: 50,
    }),
    prisma.plugin.findMany({
      where: { userId: session.user.id },
      select: { name: true, id: true },
    }),
  ])

  return {
    approvedPlugins,
    installedPluginNames: installedPlugins.map((p) => p.name),
    searchQuery: search,
  }
}

export async function action({ request }: { request: Request }) {
  const session = await requireSession(request)
  const body = await request.json()
  const { action, pluginId } = body

  if (action === 'install') {
    const plugin = await prisma.plugin.findUnique({ where: { id: pluginId } })

    if (!plugin) {
      return Response.json({ error: 'Plugin not found' }, { status: 404 })
    }

    const existing = await prisma.plugin.findUnique({
      where: { name_userId: { name: plugin.name, userId: session.user.id } },
    })

    if (existing) {
      return Response.json({ error: 'Plugin already installed' }, { status: 409 })
    }

    await prisma.$transaction([
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
          userId: session.user.id,
        },
      }),
      prisma.plugin.update({
        where: { id: pluginId },
        data: { installCount: { increment: 1 } },
      }),
    ])

    return Response.json({ success: true })
  }

  if (action === 'uninstall') {
    const plugin = await prisma.plugin.findUnique({ where: { id: pluginId } })

    if (!plugin) {
      return Response.json({ error: 'Plugin not found' }, { status: 404 })
    }

    const userPlugin = await prisma.plugin.findUnique({
      where: { name_userId: { name: plugin.name, userId: session.user.id } },
    })

    if (!userPlugin) {
      return Response.json({ error: 'Plugin not installed' }, { status: 404 })
    }

    await prisma.plugin.delete({ where: { id: userPlugin.id } })

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}

export default function Plugins({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) {
  const { approvedPlugins, installedPluginNames, searchQuery } = loaderData
  const [search, setSearch] = useState(searchQuery)

  return (
    <div className="p-6">
      <PageHeader
        title="Plugin Marketplace"
        description="Discover and install plugins to extend Creator Studio functionality"
        className="mb-6"
      >
        <Link to="/dashboard/plugins/installed">
          <Button variant="outline">
            <Puzzle className="mr-2 h-4 w-4" />
            Manage Installed
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-6">
        <form method="get" className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="search"
            placeholder="Search plugins..."
            defaultValue={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            Search
          </Button>
        </form>
      </div>

      {approvedPlugins.length === 0 ? (
        <EmptyState
          icon={<Puzzle className="h-12 w-12" />}
          title={search ? 'No plugins found' : 'No plugins available'}
          description={search ? 'Try a different search term' : 'Check back later for new plugins'}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {approvedPlugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin as Parameters<typeof PluginCard>[0]['plugin']}
              isInstalled={installedPluginNames.includes(plugin.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
