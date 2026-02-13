import { useState } from 'react'
import { Form, useFetcher } from 'react-router'
import { Webhook, Plus, Check, X, AlertCircle, Clock, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import type { Route } from './+types/webhooks'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      webhookEvents: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  return { endpoints }
}

const availableEvents = [
  { value: 'post.created', label: 'Post Created' },
  { value: 'post.published', label: 'Post Published' },
  { value: 'project.exported', label: 'Project Exported' },
  { value: 'webhook.test', label: 'Test Event' },
]

export default function Webhooks({ loaderData }: Route.ComponentProps) {
  const { endpoints } = loaderData
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const fetcher = useFetcher()

  const handleCreate = () => {
    fetcher.submit(
      { action: 'create', url, events: selectedEvents },
      { method: 'post', action: '/api/webhooks', encType: 'application/json' }
    )
    setShowCreateDialog(false)
    setUrl('')
    setSelectedEvents([])
  }

  const handleToggle = (id: string, enabled: boolean) => {
    fetcher.submit(
      { action: 'update', id, enabled: !enabled },
      { method: 'post', action: '/api/webhooks', encType: 'application/json' }
    )
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this webhook endpoint?')) {
      fetcher.submit(
        { action: 'delete', id },
        { method: 'post', action: '/api/webhooks', encType: 'application/json' }
      )
    }
  }

  const handleTest = (id: string) => {
    fetcher.submit(
      { action: 'test', id },
      { method: 'post', action: '/api/webhooks', encType: 'application/json' }
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Configure webhook endpoints to receive real-time event notifications
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Endpoint
        </Button>
      </div>

      {showCreateDialog && (
        <Card className="mb-6 p-4">
          <h3 className="mb-4 text-lg font-semibold">Create Webhook Endpoint</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Endpoint URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="https://your-domain.com/webhooks"
              />
            </div>
            <div>
              <Label>Events</Label>
              <div className="mt-2 space-y-2">
                {availableEvents.map((event) => (
                  <label key={event.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, event.value])
                        } else {
                          setSelectedEvents(selectedEvents.filter((v) => v !== event.value))
                        }
                      }}
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!url || selectedEvents.length === 0}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Endpoints</h2>
        {endpoints.length === 0 ? (
          <Card className="p-6 text-center text-[hsl(var(--muted-foreground))]">
            <Webhook className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No webhook endpoints configured</p>
          </Card>
        ) : (
          endpoints.map((endpoint: typeof endpoints[number]) => (
            <Card key={endpoint.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm">{endpoint.url}</code>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        endpoint.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {endpoint.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    Events: {endpoint.events.join(', ')}
                  </div>
                  <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Secret: {endpoint.secret.slice(0, 16)}...
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleTest(endpoint.id)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(endpoint.id, endpoint.enabled)}
                  >
                    {endpoint.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(endpoint.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {endpoint.webhookEvents.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="mb-2 text-sm font-semibold">Recent Events</h4>
                  <div className="space-y-2">
                    {endpoint.webhookEvents.slice(0, 5).map((event: typeof endpoint.webhookEvents[number]) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {event.status === 'delivered' && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                          {event.status === 'failed' && (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          {event.status === 'pending' && (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          <span>{event.eventType}</span>
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {new Date(event.createdAt).toLocaleString()}
                          {event.attempts > 0 && ` (${event.attempts} attempts)`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
