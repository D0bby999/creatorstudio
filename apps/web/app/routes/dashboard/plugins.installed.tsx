import { useFetcher, Link } from 'react-router'
import { Puzzle, Settings, Trash2, Power } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { PageHeader } from '@creator-studio/ui/components/composites/page-header'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
export async function loader({ request }: { request: Request }) {
  const session = await requireSession(request)

  const installedPlugins = await prisma.plugin.findMany({
    where: { userId: session.user.id },
    orderBy: { installedAt: 'desc' },
  })

  return { installedPlugins }
}

export async function action({ request }: { request: Request }) {
  const session = await requireSession(request)
  const body = await request.json()
  const { action, pluginId } = body

  if (action === 'toggle') {
    const plugin = await prisma.plugin.findFirst({
      where: { id: pluginId, userId: session.user.id },
    })

    if (!plugin) {
      return Response.json({ error: 'Plugin not found' }, { status: 404 })
    }

    await prisma.plugin.update({
      where: { id: pluginId },
      data: { enabled: !plugin.enabled },
    })

    return Response.json({ success: true })
  }

  if (action === 'uninstall') {
    const plugin = await prisma.plugin.findFirst({
      where: { id: pluginId, userId: session.user.id },
    })

    if (!plugin) {
      return Response.json({ error: 'Plugin not found' }, { status: 404 })
    }

    await prisma.plugin.delete({ where: { id: pluginId } })

    return Response.json({ success: true })
  }

  if (action === 'update-config') {
    const { config } = body

    await prisma.plugin.update({
      where: { id: pluginId },
      data: { config },
    })

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}

export default function InstalledPlugins({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) {
  const { installedPlugins } = loaderData
  const fetcher = useFetcher()

  const handleToggle = (pluginId: string) => {
    fetcher.submit({ action: 'toggle', pluginId }, { method: 'post', encType: 'application/json' })
  }

  const handleUninstall = (pluginId: string) => {
    if (confirm('Are you sure you want to uninstall this plugin?')) {
      fetcher.submit({ action: 'uninstall', pluginId }, { method: 'post', encType: 'application/json' })
    }
  }

  if (installedPlugins.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Installed Plugins" description="Manage your installed plugins" className="mb-6">
          <Link to="/dashboard/plugins">
            <Button>Browse Marketplace</Button>
          </Link>
        </PageHeader>
        <EmptyState
          icon={<Puzzle className="h-12 w-12" />}
          title="No plugins installed"
          description="Browse the marketplace to discover and install plugins"
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader title="Installed Plugins" description="Manage your installed plugins" className="mb-6">
        <Link to="/dashboard/plugins">
          <Button variant="outline">Browse Marketplace</Button>
        </Link>
      </PageHeader>

      <div className="space-y-4">
        {installedPlugins.map((plugin: typeof installedPlugins[number]) => (
          <Card key={plugin.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {plugin.iconUrl ? (
                    <img src={plugin.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Puzzle className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{plugin.displayName || plugin.name}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">v{plugin.version}</p>
                  </div>
                  <span
                    className={`ml-3 rounded-full px-3 py-1 text-xs font-medium ${
                      plugin.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {plugin.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {plugin.description && (
                  <p className="mt-3 text-sm text-gray-600">{plugin.description}</p>
                )}

                {plugin.author && (
                  <p className="mt-2 text-xs text-gray-500">by {plugin.author}</p>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  Installed on {new Date(plugin.installedAt).toLocaleDateString()}
                </div>

                {plugin.config && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700">
                      <Settings className="inline h-4 w-4 mr-1" />
                      Configuration
                    </summary>
                    <pre className="mt-2 rounded bg-gray-50 p-3 text-xs overflow-x-auto">
                      {JSON.stringify(plugin.config, null, 2)}
                    </pre>
                  </details>
                )}
              </div>

              <div className="ml-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant={plugin.enabled ? 'outline' : 'default'}
                  onClick={() => handleToggle(plugin.id)}
                  disabled={fetcher.state !== 'idle'}
                >
                  <Power className="mr-1 h-4 w-4" />
                  {plugin.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUninstall(plugin.id)}
                  disabled={fetcher.state !== 'idle'}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Uninstall
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
