/** Connection status indicator for collaboration mode */
import type { ConnectionStatus } from '../lib/canvas-presence-utils'

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus
  latencyMs: number
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
  connecting: { color: '#eab308', label: 'Connecting...' },
  connected: { color: '#22c55e', label: 'Connected' },
  disconnected: { color: '#ef4444', label: 'Disconnected' },
  error: { color: '#ef4444', label: 'Error' },
}

export function ConnectionStatusBadge({ status, latencyMs }: ConnectionStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <div style={badgeStyle} title={`${config.label}${status === 'connected' ? ` (${latencyMs}ms)` : ''}`}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
      <span style={{ fontSize: 11, color: '#666' }}>{config.label}</span>
      {status === 'connected' && latencyMs > 0 && (
        <span style={{ fontSize: 10, color: '#999' }}>{latencyMs}ms</span>
      )}
    </div>
  )
}

const badgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  background: '#fff',
  borderRadius: 6,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e5e5',
}
