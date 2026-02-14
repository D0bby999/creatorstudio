import { X, Download, Check, Shield, Globe, Database, Clipboard } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { useEffect } from 'react'
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

interface PluginDetailDialogProps {
  plugin: Plugin
  isInstalled: boolean
  onClose: () => void
  onInstall: () => void
  onUninstall: () => void
  isLoading: boolean
}

export function PluginDetailDialog({
  plugin,
  isInstalled,
  onClose,
  onInstall,
  onUninstall,
  isLoading,
}: PluginDetailDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const permissions = plugin.manifest?.permissions
  const hasPermissions = permissions && (permissions.network || permissions.storage || permissions.clipboard)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <Card
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-6"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            {plugin.iconUrl ? (
              <img src={plugin.iconUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                <Download className="h-8 w-8 text-gray-600" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{plugin.displayName}</h2>
              <p className="text-sm text-gray-600">
                v{plugin.version} • {plugin.author}
              </p>
              <p className="mt-1 text-sm text-gray-500">{plugin.installCount} installs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{plugin.description}</p>
          </div>

          {hasPermissions && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </h3>
              <div className="space-y-2">
                {permissions.network && permissions.network.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Globe className="h-4 w-4 mt-0.5 text-blue-600" />
                    <div>
                      <div className="font-medium">Network Access</div>
                      <div className="text-gray-600 text-xs">
                        {permissions.network.map((url, i) => (
                          <div key={i}>{url}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {permissions.storage && (
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-green-600" />
                    <span>Storage Access</span>
                  </div>
                )}
                {permissions.clipboard && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clipboard className="h-4 w-4 text-purple-600" />
                    <span>Clipboard Access</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {plugin.manifest?.contributes?.hooks && plugin.manifest.contributes.hooks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Hooks</h3>
              <div className="flex flex-wrap gap-2">
                {plugin.manifest.contributes.hooks.map((hook) => (
                  <span
                    key={hook}
                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                  >
                    {hook}
                  </span>
                ))}
              </div>
            </div>
          )}

          {plugin.manifest?.activationEvents && plugin.manifest.activationEvents.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Activation Events</h3>
              <div className="flex flex-wrap gap-2">
                {plugin.manifest.activationEvents.map((event) => (
                  <span
                    key={event}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              className="flex-1"
              variant={isInstalled ? 'outline' : 'default'}
              onClick={isInstalled ? onUninstall : onInstall}
              disabled={isLoading}
            >
              {isInstalled ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Uninstall
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Install Plugin
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
