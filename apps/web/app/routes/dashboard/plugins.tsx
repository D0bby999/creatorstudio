import { useState } from 'react'
import { Form, useFetcher } from 'react-router'
import { Puzzle, FileText, Droplet, BarChart3 } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import type { Route } from './+types/plugins'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const installedPlugins = await prisma.plugin.findMany({
    where: { userId: session.user.id },
    orderBy: { installedAt: 'desc' },
  })

  return { installedPlugins }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const body = await request.json()
  const { action, pluginName } = body

  if (action === 'toggle') {
    const existing = await prisma.plugin.findFirst({
      where: { name: pluginName, userId: session.user.id },
    })

    if (existing) {
      await prisma.plugin.update({
        where: { id: existing.id },
        data: { enabled: !existing.enabled },
      })
    } else {
      await prisma.plugin.create({
        data: {
          name: pluginName,
          enabled: true,
          userId: session.user.id,
        },
      })
    }

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}

const availablePlugins = [
  {
    name: 'pdf-export',
    label: 'PDF Export',
    description: 'Export canvas designs as high-quality PDF files',
    icon: FileText,
    color: 'text-red-600',
  },
  {
    name: 'watermark',
    label: 'Watermark',
    description: 'Automatically add watermarks to exported images and videos',
    icon: Droplet,
    color: 'text-blue-600',
  },
  {
    name: 'analytics-widget',
    label: 'Analytics Widget',
    description: 'Enhanced analytics dashboard with custom metrics and charts',
    icon: BarChart3,
    color: 'text-green-600',
  },
]

export default function Plugins({ loaderData }: Route.ComponentProps) {
  const { installedPlugins } = loaderData
  const fetcher = useFetcher()

  const isPluginEnabled = (pluginName: string) => {
    const plugin = installedPlugins.find((p: typeof installedPlugins[number]) => p.name === pluginName)
    return plugin?.enabled || false
  }

  const handleToggle = (pluginName: string) => {
    fetcher.submit(
      { action: 'toggle', pluginName },
      { method: 'post', encType: 'application/json' }
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Plugins</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Extend Creator Studio with additional features and integrations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availablePlugins.map((plugin) => {
          const Icon = plugin.icon
          const enabled = isPluginEnabled(plugin.name)

          return (
            <Card key={plugin.name} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg bg-gray-100 p-2 ${plugin.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{plugin.label}</h3>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      {plugin.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant={enabled ? 'outline' : 'default'}
                  onClick={() => handleToggle(plugin.name)}
                  className="w-full"
                >
                  {enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
              {enabled && (
                <div className="mt-2 rounded bg-green-50 px-3 py-2 text-xs text-green-800">
                  Plugin active
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {installedPlugins.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Installed Plugins</h2>
          <div className="space-y-3">
            {installedPlugins.map((plugin: typeof installedPlugins[number]) => (
              <Card key={plugin.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{plugin.name}</h3>
                    <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      <div>Version: {plugin.version}</div>
                      <div>Installed: {new Date(plugin.installedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded px-3 py-1 text-sm ${
                      plugin.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {plugin.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {installedPlugins.length === 0 && (
        <Card className="mt-8 p-6 text-center text-[hsl(var(--muted-foreground))]">
          <Puzzle className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No plugins installed yet</p>
        </Card>
      )}
    </div>
  )
}
