/** WebSocket sync hook for real-time canvas collaboration with offline support */
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ConnectionStatus, PresenceData } from '../lib/canvas-presence-utils'
import { ReconnectStrategy } from '../lib/sync/canvas-sync-reconnect'
import { OfflineQueue } from '../lib/sync/canvas-sync-offline-queue'

interface UseCanvasSyncOptions {
  roomId: string
  token: string
  wsUrl: string
  userId: string
  userName: string
  enabled?: boolean
}

interface CanvasSyncState {
  status: ConnectionStatus
  users: Map<string, PresenceData>
  latencyMs: number
  queueSize: number
}

export function useCanvasSync({
  roomId, token, wsUrl, userId, userName, enabled = true,
}: UseCanvasSyncOptions) {
  const [state, setState] = useState<CanvasSyncState>({
    status: 'disconnected',
    users: new Map(),
    latencyMs: 0,
    queueSize: 0,
  })
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPingTime = useRef(0)
  const reconnectStrategy = useRef(new ReconnectStrategy({ maxAttempts: 5 }))
  const offlineQueue = useRef(new OfflineQueue({ maxSize: 1000 }))
  const scheduleReconnectRef = useRef<() => void>(() => {})

  const cleanup = useCallback(() => {
    if (pingTimer.current) clearInterval(pingTimer.current)
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!enabled) return
    cleanup()
    setState(s => ({ ...s, status: 'connecting' }))

    const url = `${wsUrl}/${roomId}?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(userId)}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setState(s => ({ ...s, status: 'connected', queueSize: 0 }))
      reconnectStrategy.current.reset()
      lastPingTime.current = 0

      // Replay queued operations from offline period
      const queued = offlineQueue.current.flush()
      if (queued.length > 0) {
        console.log(`[CanvasSync] Replaying ${queued.length} queued operations`)
        for (const op of queued) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: op.type, data: op.data }))
          }
        }
      }

      // Ping every 30s
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          lastPingTime.current = Date.now()
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30_000)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'pong' && lastPingTime.current > 0) {
          const latency = Date.now() - lastPingTime.current
          setState(s => ({ ...s, latencyMs: latency }))
        } else if (msg.type === 'presence') {
          const presenceMap = new Map<string, PresenceData>()
          for (const p of msg.data ?? []) {
            if (p.userId !== userId) presenceMap.set(p.userId, p)
          }
          setState(s => ({ ...s, users: presenceMap }))
        } else if (msg.type === 'error') {
          console.error('[CanvasSync] Server error:', msg.code, msg.message)
        }
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = () => {
      setState(s => ({ ...s, status: 'disconnected', users: new Map() }))
      scheduleReconnectRef.current()
    }

    ws.onerror = () => {
      setState(s => ({ ...s, status: 'error' }))
    }
  }, [enabled, wsUrl, roomId, token, userId, cleanup])

  // Keep ref in sync so ws.onclose always calls the latest version
  scheduleReconnectRef.current = () => {
    const delay = reconnectStrategy.current.getNextDelay()
    if (delay === null) {
      console.warn('[CanvasSync] Max reconnection attempts reached')
      setState(s => ({ ...s, status: 'error' }))
      return
    }

    console.log(`[CanvasSync] Reconnecting in ${delay}ms (attempt ${reconnectStrategy.current.getAttempt()})`)
    reconnectTimer.current = setTimeout(connect, delay)
  }

  useEffect(() => {
    if (enabled) connect()
    return cleanup
  }, [enabled, roomId, token, connect, cleanup])

  const sendDiff = useCallback((diff: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'diff', data: diff }))
    } else {
      // Queue operation if offline
      offlineQueue.current.enqueue('diff', diff)
      setState(s => ({ ...s, queueSize: offlineQueue.current.size() }))
    }
  }, [])

  const sendPresence = useCallback((cursor: { x: number; y: number } | null, selectedShapeIds: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'presence',
        data: { cursor, selectedShapeIds },
      }))
    }
    // Presence data is ephemeral, don't queue if offline
  }, [])

  const disconnect = useCallback(() => {
    cleanup()
    offlineQueue.current.clear()
    setState({ status: 'disconnected', users: new Map(), latencyMs: 0, queueSize: 0 })
  }, [cleanup])

  return {
    ...state,
    sendDiff,
    sendPresence,
    disconnect,
  }
}
