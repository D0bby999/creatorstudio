import { Monitor, Smartphone, Globe } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'

interface SessionCardProps {
  session: {
    id: string
    ipAddress: string | null
    userAgent: string | null
    createdAt: string
    updatedAt: string
  }
  isCurrent: boolean
  onRevoke: (sessionId: string) => void
  loading?: boolean
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown', browser: 'Unknown' }

  const isMobile = /mobile|android|iphone|ipad/i.test(ua)
  const device = isMobile ? 'Mobile' : 'Desktop'

  let browser = 'Unknown'
  if (/chrome/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'Chrome'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
  else if (/edg/i.test(ua)) browser = 'Edge'
  else if (/opr|opera/i.test(ua)) browser = 'Opera'

  return { device, browser }
}

function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function SessionCard({ session, isCurrent, onRevoke, loading }: SessionCardProps) {
  const { device, browser } = parseUserAgent(session.userAgent)
  const DeviceIcon = device === 'Mobile' ? Smartphone : Monitor

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3 min-w-0">
        <DeviceIcon className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{browser} on {device}</span>
            {isCurrent && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                Current
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {session.ipAddress && (
              <>
                <Globe className="h-3 w-3" />
                <span>{session.ipAddress}</span>
              </>
            )}
            <span>Active {timeAgo(session.updatedAt)}</span>
          </div>
        </div>
      </div>

      {!isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive shrink-0"
          onClick={() => onRevoke(session.id)}
          disabled={loading}
        >
          Revoke
        </Button>
      )}
    </div>
  )
}
