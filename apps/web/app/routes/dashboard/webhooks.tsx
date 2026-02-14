import { useState } from 'react'
import { useFetcher } from 'react-router'
import { Webhook, Plus } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { PageHeader } from '@creator-studio/ui/components/composites/page-header'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'
import { WebhookEndpointCard } from '~/components/webhooks/webhook-endpoint-card'
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
      <PageHeader
        title="Webhooks"
        description="Configure webhook endpoints to receive real-time event notifications"
        className="mb-6"
      >
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Endpoint
        </Button>
      </PageHeader>

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
          <EmptyState
            icon={<Webhook className="h-12 w-12" />}
            title="No webhook endpoints configured"
            description="Create your first webhook endpoint to start receiving events"
          />
        ) : (
          endpoints.map((endpoint: typeof endpoints[number]) => (
            <WebhookEndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onTest={handleTest}
            />
          ))
        )}
      </div>
    </div>
  )
}
