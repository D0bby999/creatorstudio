import { useFetcher } from 'react-router'
import { Star, Download, Check, Puzzle } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { Badge } from '@creator-studio/ui/components/badge'
import { useState } from 'react'

interface Plugin {
  id: string
  name: string
  displayName: string
  version: string
  description: string
  author: string
  iconUrl?: string | null
  installCount: number
  avgRating: number
  featured: boolean
  tags: string[]
  category?: { id: string; name: string; slug: string; icon?: string | null } | null
}

interface MarketplacePluginCardProps {
  plugin: Plugin
  isInstalled: boolean
}

export function MarketplacePluginCard({ plugin, isInstalled }: MarketplacePluginCardProps) {
  const fetcher = useFetcher()
  const [showDetails, setShowDetails] = useState(false)
  const isLoading = fetcher.state !== 'idle'

  const handleInstall = (e: React.MouseEvent) => {
    e.stopPropagation()
    fetcher.submit(
      { action: 'install', pluginId: plugin.id },
      { method: 'post', encType: 'application/json', action: '/dashboard/plugins' }
    )
  }

  const handleUninstall = (e: React.MouseEvent) => {
    e.stopPropagation()
    fetcher.submit(
      { action: 'uninstall', pluginId: plugin.id },
      { method: 'post', encType: 'application/json', action: '/dashboard/plugins' }
    )
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {plugin.iconUrl ? (
          <img src={plugin.iconUrl} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
            <Puzzle className="h-6 w-6 text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{plugin.displayName}</h3>
            {plugin.featured && (
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">v{plugin.version}</p>
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{plugin.description}</p>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{plugin.avgRating > 0 ? plugin.avgRating.toFixed(1) : 'N/A'}</span>
        </div>
        <span>•</span>
        <span>{plugin.installCount.toLocaleString()} installs</span>
      </div>

      {plugin.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {plugin.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {plugin.category && (
            <span>
              {plugin.category.icon} {plugin.category.name}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={isInstalled ? 'outline' : 'default'}
          onClick={isInstalled ? handleUninstall : handleInstall}
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
  )
}
