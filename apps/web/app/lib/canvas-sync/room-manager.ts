// In-memory room state management with Redis pub/sub coordination
// Handles multi-instance broadcasting and rate limiting

import { cacheGet, cacheSet, cacheDel } from '@creator-studio/redis'
import { loadSnapshot, saveSnapshot } from './snapshot-persistence'
import { getAllPresence, removePresence, clearRoomPresence } from './presence-tracker'
import type { RecordsDiff, ServerMessage, PresenceData } from './message-protocol'
import { createDiffMessage, createPresenceMessage } from './message-protocol'

export interface UserConnection {
  userId: string
  userName: string
  ws: unknown // WebSocket or similar, kept abstract
  lastMessageTime: number
  messageCount: number
}

export interface Room {
  id: string
  snapshot: Record<string, unknown>
  users: Map<string, UserConnection>
  lastActivity: Date
}

const rooms = new Map<string, Room>()
const INACTIVE_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_WINDOW_MS = 1000 // 1 second
const RATE_LIMIT_MAX_MESSAGES = 10

let cleanupIntervalId: NodeJS.Timeout | null = null

/**
 * Start periodic room cleanup
 */
export function startRoomCleanup(): void {
  if (cleanupIntervalId !== null) return // Already started

  cleanupIntervalId = setInterval(() => {
    const now = Date.now()
    for (const [roomId, room] of rooms) {
      if (now - room.lastActivity.getTime() > INACTIVE_TIMEOUT_MS) {
        cleanupRoom(roomId)
      }
    }
  }, 5 * 60 * 1000) // Check every 5 minutes
}

/**
 * Stop periodic room cleanup
 */
export function stopRoomCleanup(): void {
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId)
    cleanupIntervalId = null
  }
}

function cleanupRoom(roomId: string): void {
  rooms.delete(roomId)
  clearRoomPresence(roomId)
  cacheDel(`canvas:room:${roomId}`).catch(() => {}) // Non-blocking
}

export async function createRoom(
  roomId: string,
  initialSnapshot?: Record<string, unknown>
): Promise<Room> {
  const existing = rooms.get(roomId)
  if (existing) return existing

  // Load from DB if exists
  const snapshot = initialSnapshot ?? (await loadSnapshot(roomId)) ?? {}

  const room: Room = {
    id: roomId,
    snapshot,
    users: new Map(),
    lastActivity: new Date(),
  }

  rooms.set(roomId, room)
  await cacheSet(`canvas:room:${roomId}`, { active: true }, 3600) // 1h TTL

  return room
}

export async function joinRoom(
  roomId: string,
  userId: string,
  userName: string,
  ws: unknown
): Promise<Room> {
  // Lazy-start cleanup on first room join
  if (cleanupIntervalId === null) {
    startRoomCleanup()
  }

  let room = rooms.get(roomId)
  if (!room) {
    room = await createRoom(roomId)
  }

  const connection: UserConnection = {
    userId,
    userName,
    ws,
    lastMessageTime: 0,
    messageCount: 0,
  }

  room.users.set(userId, connection)
  room.lastActivity = new Date()

  return room
}

export function leaveRoom(roomId: string, userId: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  room.users.delete(userId)
  removePresence(roomId, userId)

  // Broadcast updated presence to remaining users
  const presences = getAllPresence(roomId)
  broadcastToRoom(roomId, createPresenceMessage(presences), userId)

  if (room.users.size === 0) {
    cleanupRoom(roomId)
  }
}

export function checkRateLimit(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId)
  if (!room) return false

  const user = room.users.get(userId)
  if (!user) return false

  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS

  // Reset counter if window expired
  if (user.lastMessageTime < windowStart) {
    user.messageCount = 0
    user.lastMessageTime = now
  }

  user.messageCount++

  if (user.messageCount > RATE_LIMIT_MAX_MESSAGES) {
    return false // Rate limit exceeded
  }

  user.lastMessageTime = now
  return true
}

export async function broadcastDiff(
  roomId: string,
  diff: RecordsDiff,
  senderId: string,
  senderName: string
): Promise<void> {
  const room = rooms.get(roomId)
  if (!room) return

  // Update room snapshot
  applyDiffToSnapshot(room.snapshot, diff)
  room.lastActivity = new Date()

  // Save snapshot (debounced)
  await saveSnapshot(roomId, room.snapshot).catch((err) =>
    console.error('[room-manager] Failed to save snapshot:', err)
  )

  // Broadcast to all users except sender
  const message = createDiffMessage(diff, senderId, senderName)
  broadcastToRoom(roomId, message, senderId)

  // Publish to Redis for multi-instance sync
  await publishToRedis(roomId, message).catch(() => {}) // Non-blocking
}

export function broadcastPresence(roomId: string, presences: PresenceData[]): void {
  const message = createPresenceMessage(presences)
  broadcastToRoom(roomId, message)
}

function broadcastToRoom(roomId: string, message: ServerMessage, excludeUserId?: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  const payload = JSON.stringify(message)

  for (const [userId, connection] of room.users) {
    if (excludeUserId && userId === excludeUserId) continue

    // Type-safe send using unknown ws (caller handles actual WebSocket)
    const ws = connection.ws as any
    if (ws && typeof ws.send === 'function') {
      try {
        ws.send(payload)
      } catch (error) {
        console.error('[room-manager] Failed to send message:', error)
      }
    }
  }
}

function applyDiffToSnapshot(snapshot: Record<string, unknown>, diff: RecordsDiff): void {
  // Apply additions/updates
  Object.assign(snapshot, diff.added, diff.updated)

  // Apply removals
  for (const key of Object.keys(diff.removed)) {
    delete snapshot[key]
  }
}

async function publishToRedis(roomId: string, message: ServerMessage): Promise<void> {
  try {
    await cacheSet(`canvas:broadcast:${roomId}:${Date.now()}`, message, 10) // 10s TTL
  } catch (error) {
    // Graceful degradation — single instance still works
  }
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId)
}

export function getRoomUserCount(roomId: string): number {
  return rooms.get(roomId)?.users.size ?? 0
}

// For testing
export function resetRoomManager(): void {
  stopRoomCleanup()
  rooms.clear()
}
