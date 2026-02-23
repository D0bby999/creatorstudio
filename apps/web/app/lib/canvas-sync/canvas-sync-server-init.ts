// Auto-start WebSocket server on first import (server-side only)
// Import this in entry.server.tsx or a server-side loader

import { startWebSocketServer } from './websocket-server'

let initialized = false

export function initCanvasSyncServer(): void {
  if (initialized) return
  if (typeof process === 'undefined') return // Client-side guard

  initialized = true
  startWebSocketServer()
}
