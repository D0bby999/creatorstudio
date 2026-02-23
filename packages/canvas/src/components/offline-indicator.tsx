// Prominent banner shown when WebSocket is disconnected during collaboration
// Auto-hides 3s after reconnection

import { useState, useEffect, useRef } from 'react'
import type { ConnectionStatus } from '../lib/canvas-presence-utils'

interface OfflineIndicatorProps {
  status: ConnectionStatus
  queueSize: number
}

export function OfflineIndicator({ status, queueSize }: OfflineIndicatorProps) {
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasDisconnected = useRef(false)

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)

    if (status === 'disconnected' || status === 'error') {
      wasDisconnected.current = true
      setVisible(true)
    } else if (status === 'connected' && wasDisconnected.current) {
      // Show "reconnected" briefly, then auto-hide
      hideTimer.current = setTimeout(() => {
        setVisible(false)
        wasDisconnected.current = false
      }, 3000)
    } else if (status === 'connecting' && wasDisconnected.current) {
      setVisible(true)
    } else {
      setVisible(false)
    }

    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [status])

  if (!visible) return null

  const isReconnected = status === 'connected' && wasDisconnected.current
  const isConnecting = status === 'connecting'

  return (
    <div style={bannerStyle(isReconnected)} role="status" aria-live="polite">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={dotStyle(isReconnected ? '#22c55e' : isConnecting ? '#eab308' : '#ef4444')} />
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {isReconnected ? 'Reconnected' : isConnecting ? 'Reconnecting...' : 'Offline'}
        </span>
      </div>
      {!isReconnected && queueSize > 0 && (
        <span style={{ fontSize: 11, color: '#fff', opacity: 0.8 }}>
          {queueSize} change{queueSize !== 1 ? 's' : ''} queued
        </span>
      )}
    </div>
  )
}

function bannerStyle(reconnected: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: 48,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 16px',
    borderRadius: 8,
    background: reconnected ? '#166534' : '#991b1b',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'slideDown 200ms ease-out',
    pointerEvents: 'none' as const,
  }
}

function dotStyle(color: string): React.CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }
}
