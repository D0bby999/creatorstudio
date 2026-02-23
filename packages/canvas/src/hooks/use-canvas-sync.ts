/** WebSocket sync hook for real-time canvas collaboration */
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ConnectionStatus, PresenceData } from '../lib/canvas-presence-utils'

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
}

export function useCanvasSync({
  roomId, token, wsUrl, userId, userName, enabled = true,
}: UseCanvasSyncOptions) {
  const [state, setState] = useState<CanvasSyncState>({
    status: 'disconnected',
    users: new Map(),
    latencyMs: 0,
  })
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempt = useRef(0)
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPingTime = useRef(0)

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
      setState(s => ({ ...s, status: 'connected' }))
      reconnectAttempt.current = 0
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
        if (msg.type === 'pong') {
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
      scheduleReconnect()
    }

    ws.onerror = () => {
      setState(s => ({ ...s, status: 'error' }))
    }
  }, [enabled, wsUrl, roomId, token, userId, cleanup])

  const scheduleReconnect = useCallback(() => {
    const attempt = reconnectAttempt.current
    if (attempt >= 10) return // Give up after 10 attempts
    const delay = Math.min(1000 * Math.pow(2, attempt), 30_000)
    reconnectAttempt.current = attempt + 1
    reconnectTimer.current = setTimeout(connect, delay)
  }, [connect])

  useEffect(() => {
    if (enabled) connect()
    return cleanup
  }, [enabled, roomId, token, connect, cleanup])

  const sendDiff = useCallback((diff: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'diff', data: diff }))
    }
  }, [])

  const sendPresence = useCallback((cursor: { x: number; y: number } | null, selectedShapeIds: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'presence',
        data: { cursor, selectedShapeIds, userName },
      }))
    }
  }, [userName])

  const disconnect = useCallback(() => {
    reconnectAttempt.current = 999 // Prevent reconnect
    cleanup()
    setState({ status: 'disconnected', users: new Map(), latencyMs: 0 })
  }, [cleanup])

  return {
    ...state,
    sendDiff,
    sendPresence,
    disconnect,
  }
}
