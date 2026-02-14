import { useFetcher } from 'react-router'
import { Puzzle, Download, Check } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { useState } from 'react'
import { PluginDetailDialog } from './plugin-detail-dialog'
import type { PluginManifest } from '~/lib/plugins/plugin-manifest-schema'

interface Plugin {
  id: string
  name: string
  displayName: string
  version: string
  description: string
  author: string
  iconUrl?: string | null
  installCount: number
  manifest?: PluginManifest | null
  sourceUrl?: string | null
}

interface PluginCardProps {
  plugin: Plugin
  isInstalled: boolean
}

export function PluginCard({ plugin, isInstalled }: PluginCardProps) {
  const fetcher = useFetcher()
  const [showDetails, setShowDetails] = useState(false)
  const isLoading = fetcher.state !== 'idle'

  const handleInstall = () => {
    fetcher.submit({ action: 'install', pluginId: plugin.id }, { method: 'post', encType: 'application/json' })
  }

  const handleUninstall = () => {
    fetcher.submit({ action: 'uninstall', pluginId: plugin.id }, { method: 'post', encType: 'application/json' })
  }

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDetails(true)}>
        <div className="flex items-start gap-3">
          {plugin.iconUrl ? (
            <img src={plugin.iconUrl} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
              <Puzzle className="h-6 w-6 text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{plugin.displayName}</h3>
            <p className="text-xs text-gray-500">v{plugin.version}</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
              {plugin.description}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {plugin.author && <div>by {plugin.author}</div>}
            <div className="mt-0.5">{plugin.installCount} installs</div>
          </div>

          <Button
            size="sm"
            variant={isInstalled ? 'outline' : 'default'}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              isInstalled ? handleUninstall() : handleInstall()
            }}
            disabled={isLoading}
          >
            {isInstalled ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Installed
              </>
            ) : (
              <>
                <Download className="mr-1 h-3 w-3" />
                Install
              </>
            )}
          </Button>
        </div>
      </Card>

      {showDetails && (
        <PluginDetailDialog
          plugin={plugin}
          isInstalled={isInstalled}
          onClose={() => setShowDetails(false)}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
          isLoading={isLoading}
        />
      )}
    </>
  )
}
