import { useState, useEffect } from 'react'
import { useFetcher } from 'react-router'
import { Key, Plus, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { PageHeader } from '@creator-studio/ui/components/composites/page-header'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import type { Route } from './+types/api-keys'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      rateLimit: true,
      scopes: true,
      enabled: true,
      createdAt: true,
      expiresAt: true,
    },
  })

  return { apiKeys }
}

export default function ApiKeys({ loaderData }: Route.ComponentProps) {
  const { apiKeys } = loaderData
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [name, setName] = useState('')
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fetcher = useFetcher()

  const handleCreate = () => {
    fetcher.submit(
      { action: 'create', name },
      { method: 'post', action: '/api/api-keys', encType: 'application/json' }
    )
    setShowCreateDialog(false)
    setName('')
  }

  const handleDelete = (id: string) => {
    if (confirm('Revoke this API key? This action cannot be undone.')) {
      fetcher.submit(
        { action: 'delete', id },
        { method: 'post', action: '/api/api-keys', encType: 'application/json' }
      )
    }
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (fetcher.data?.apiKey && !newApiKey) {
      setNewApiKey(fetcher.data.apiKey.key)
    }
  }, [fetcher.data])

  return (
    <div className="p-6">
      <PageHeader
        title="API Keys"
        description="Manage API keys for programmatic access to Creator Studio"
        className="mb-6"
      >
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </PageHeader>

      {showCreateDialog && (
        <Card className="mb-6 p-4">
          <h3 className="mb-4 text-lg font-semibold">Create API Key</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="My Application Key"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!name}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {newApiKey && (
        <Card className="mb-6 border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 text-lg font-semibold">API Key Created</h3>
          <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
            Copy this key now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white p-2 text-sm">{newApiKey}</code>
            <Button size="sm" onClick={() => handleCopy(newApiKey)}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setNewApiKey(null)}
          >
            Dismiss
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your API Keys</h2>
        {apiKeys.length === 0 ? (
          <EmptyState
            icon={<Key className="h-12 w-12" />}
            title="No API keys created"
            description="Create your first API key to access Creator Studio programmatically"
          />
        ) : (
          <div className="space-y-3">
            {apiKeys.map((apiKey: typeof apiKeys[number]) => (
              <Card key={apiKey.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          apiKey.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {apiKey.enabled ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <div>Rate limit: {apiKey.rateLimit} requests/min</div>
                      <div>Scopes: {apiKey.scopes.join(', ')}</div>
                      <div>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</div>
                      {apiKey.lastUsedAt && (
                        <div>Last used: {new Date(apiKey.lastUsedAt).toLocaleString()}</div>
                      )}
                      {apiKey.expiresAt && (
                        <div>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  {apiKey.enabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(apiKey.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
