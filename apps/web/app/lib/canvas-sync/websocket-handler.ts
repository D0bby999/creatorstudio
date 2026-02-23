// WebSocket connection handler for canvas collaboration
// Routes messages, validates auth, manages lifecycle

import {
  joinRoom,
  leaveRoom,
  broadcastDiff,
  broadcastPresence,
  checkRateLimit,
} from './room-manager'
import {
  parseClientMessage,
  createSnapshotMessage,
  createErrorMessage,
  createPongMessage,
  createPresenceMessage,
} from './message-protocol'
import { updatePresence, getAllPresence, removePresence } from './presence-tracker'
import type { ErrorCode } from './message-protocol'
import { auth } from '~/lib/auth-server'
import { prisma } from '@creator-studio/db/client'

interface WebSocketLike {
  send(data: string): void
  close(code?: number, reason?: string): void
  on?(event: string, handler: (...args: any[]) => void): void
  addEventListener?(event: string, handler: (...args: any[]) => void): void
}

/**
 * Verifies WebSocket authentication and room authorization
 * @param token - Session token from better-auth cookie
 * @param roomId - Canvas room ID to verify access to
 * @returns User info if authorized, null otherwise
 */
async function verifyWebSocketAuth(
  token: string,
  roomId: string
): Promise<{ userId: string; userName: string } | null> {
  try {
    // Validate session using better-auth
    const headers = new Headers()
    headers.set('cookie', `better-auth.session_token=${token}`)
    const session = await auth.api.getSession({ headers })

    if (!session) {
      console.warn('[websocket-handler] No valid session found')
      return null
    }

    // Verify user has access to this room (owner or member)
    const room = await prisma.canvasRoom.findUnique({
      where: { id: roomId },
      include: { members: true },
    })

    if (!room) {
      console.warn('[websocket-handler] Room not found:', roomId)
      return null
    }

    const isOwner = room.ownerId === session.user.id
    const isMember = room.members.some((m) => m.userId === session.user.id)

    if (!isOwner && !isMember) {
      console.warn('[websocket-handler] User not authorized for room:', {
        userId: session.user.id,
        roomId,
      })
      return null
    }

    return {
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
    }
  } catch (error) {
    console.error('[websocket-handler] Auth verification failed:', error)
    return null
  }
}

export async function handleWebSocketConnection(
  ws: WebSocketLike,
  roomId: string,
  token: string
): Promise<void> {
  // Verify authentication and authorization
  const authResult = await verifyWebSocketAuth(token, roomId)
  if (!authResult) {
    ws.close(4001, 'Unauthorized')
    return
  }

  const { userId, userName } = authResult
  try {
    // Join room and get initial snapshot
    const room = await joinRoom(roomId, userId, userName, ws)

    // Send initial snapshot
    const snapshotMsg = createSnapshotMessage(room.snapshot)
    ws.send(JSON.stringify(snapshotMsg))

    // Send current presence states
    const presences = getAllPresence(roomId)
    ws.send(JSON.stringify(createPresenceMessage(presences)))

    // Setup message handler
    const handleMessage = async (data: string) => {
      try {
        const raw = JSON.parse(data)
        const message = parseClientMessage(raw)

        if (!message) {
          sendError(ws, 'INVALID_MESSAGE', 'Invalid message format')
          return
        }

        // Check rate limit
        if (!checkRateLimit(roomId, userId)) {
          sendError(ws, 'RATE_LIMITED', 'Too many messages, slow down')
          return
        }

        // Route message by type
        switch (message.type) {
          case 'diff':
            await broadcastDiff(roomId, message.data, userId, userName)
            break

          case 'presence': {
            const presence = updatePresence(roomId, userId, userName, message.data)
            const allPresence = getAllPresence(roomId)
            broadcastPresence(roomId, allPresence)
            break
          }

          case 'ping':
            ws.send(JSON.stringify(createPongMessage()))
            break
        }
      } catch (error) {
        console.error('[websocket-handler] Message processing error:', error)
        sendError(ws, 'INTERNAL_ERROR', 'Failed to process message')
      }
    }

    const handleClose = () => {
      leaveRoom(roomId, userId)
      removePresence(roomId, userId)
    }

    const handleError = (error: Error) => {
      console.error('[websocket-handler] WebSocket error:', error)
      leaveRoom(roomId, userId)
      removePresence(roomId, userId)
    }

    // Attach event handlers (support both Node.js ws and browser WebSocket)
    if (typeof ws.on === 'function') {
      ws.on('message', (data: Buffer | string) => {
        const text = typeof data === 'string' ? data : data.toString()
        handleMessage(text).catch(console.error)
      })
      ws.on('close', handleClose)
      ws.on('error', handleError)
    } else if (typeof ws.addEventListener === 'function') {
      ws.addEventListener('message', (event: any) => {
        handleMessage(event.data).catch(console.error)
      })
      ws.addEventListener('close', handleClose)
      ws.addEventListener('error', (event: any) => handleError(event as Error))
    }
  } catch (error) {
    console.error('[websocket-handler] Connection setup failed:', error)
    sendError(ws, 'INTERNAL_ERROR', 'Failed to establish connection')
    ws.close(1011, 'Internal error')
  }
}

function sendError(ws: WebSocketLike, code: ErrorCode, message: string): void {
  try {
    ws.send(JSON.stringify(createErrorMessage(code, message)))
  } catch (error) {
    console.error('[websocket-handler] Failed to send error:', error)
  }
}
