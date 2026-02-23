// Standalone WebSocket server for canvas collaboration
// Runs on separate port, uses existing handler/room-manager/presence-tracker

import { WebSocketServer, type WebSocket } from 'ws'
import type { IncomingMessage } from 'node:http'
import { handleWebSocketConnection } from './websocket-handler'
import { globalWebSocketMetrics } from './websocket-monitoring'
import { startRoomCleanup, stopRoomCleanup } from './room-manager'

const DEFAULT_PORT = 5174
const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024 // 10MB

let wss: WebSocketServer | null = null

export function startWebSocketServer(port?: number): WebSocketServer {
  if (wss) return wss

  const wsPort = port ?? parseInt(process.env.CANVAS_WS_PORT ?? String(DEFAULT_PORT), 10)

  wss = new WebSocketServer({
    port: wsPort,
    maxPayload: MAX_PAYLOAD_BYTES,
    perMessageDeflate: true,
  })

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? '/', `http://localhost:${wsPort}`)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // Expected path: /api/canvas/sync/:roomId
    if (pathSegments.length < 4 || pathSegments[0] !== 'api' || pathSegments[1] !== 'canvas' || pathSegments[2] !== 'sync') {
      ws.close(4000, 'Invalid path')
      return
    }

    const roomId = pathSegments[3]
    const token = url.searchParams.get('token') ?? ''

    if (!roomId || !token) {
      ws.close(4001, 'Missing roomId or token')
      return
    }

    globalWebSocketMetrics.trackConnection(roomId)

    ws.on('close', () => {
      globalWebSocketMetrics.trackDisconnection(roomId)
    })

    ws.on('error', () => {
      globalWebSocketMetrics.trackError(roomId, 'connection_error')
    })

    handleWebSocketConnection(ws as any, roomId, token).catch((err) => {
      console.error('[websocket-server] Handler error:', err)
      ws.close(1011, 'Internal error')
    })
  })

  wss.on('listening', () => {
    console.log(`[websocket-server] Canvas sync server listening on port ${wsPort}`)
  })

  wss.on('error', (err) => {
    console.error('[websocket-server] Server error:', err)
  })

  startRoomCleanup()

  return wss
}

export function stopWebSocketServer(): Promise<void> {
  return new Promise((resolve) => {
    stopRoomCleanup()
    if (wss) {
      wss.close(() => {
        wss = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss
}
