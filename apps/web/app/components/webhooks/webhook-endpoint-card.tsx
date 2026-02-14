import { Check, X, Clock, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'

interface WebhookEndpointCardProps {
  endpoint: any
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
  onTest: (id: string) => void
}

export function WebhookEndpointCard({ endpoint, onToggle, onDelete, onTest }: WebhookEndpointCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <code className="text-sm">{endpoint.url}</code>
            <span
              className={`rounded px-2 py-1 text-xs ${
                endpoint.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {endpoint.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Events: {endpoint.events.join(', ')}</div>
          <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Secret: {endpoint.secret.slice(0, 16)}...</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onTest(endpoint.id)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggle(endpoint.id, endpoint.enabled)}>
            {endpoint.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(endpoint.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {endpoint.webhookEvents.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="mb-2 text-sm font-semibold">Recent Events</h4>
          <div className="space-y-2">
            {endpoint.webhookEvents.slice(0, 5).map((event: typeof endpoint.webhookEvents[number]) => (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {event.status === 'delivered' && <Check className="h-4 w-4 text-green-600" />}
                  {event.status === 'failed' && <X className="h-4 w-4 text-red-600" />}
                  {event.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
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
  )
}
