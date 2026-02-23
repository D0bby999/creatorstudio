// In-memory room state management with ioredis Pub/Sub cross-instance sync
// Hot path: in-memory Map. Cold path: Redis persistence + Pub/Sub broadcast.

import { cacheSet, cacheDel } from '@creator-studio/redis'
import { loadSnapshot, saveSnapshot } from './snapshot-persistence'
import { getAllPresence, removePresence, clearRoomPresence } from './presence-tracker'
import type { RecordsDiff, ServerMessage, PresenceData } from './message-protocol'
import { createDiffMessage, createPresenceMessage } from './message-protocol'
import {
  createRedisSyncStorage,
  type RedisSyncStorage,
} from '@creator-studio/canvas/lib/storage/redis-sync-storage'

export interface UserConnection {
  userId: string
  userName: string
  ws: unknown
  lastMessageTime: number
  messageCount: number
}

export interface Room {
  id: string
  snapshot: Record<string, unknown>
  users: Map<string, UserConnection>
  lastActivity: Date
  redisStorage: RedisSyncStorage | null
}

const rooms = new Map<string, Room>()
const INACTIVE_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_WINDOW_MS = 1000
const RATE_LIMIT_MAX_MESSAGES = 10

let cleanupIntervalId: NodeJS.Timeout | null = null

export function startRoomCleanup(): void {
  if (cleanupIntervalId !== null) return

  cleanupIntervalId = setInterval(() => {
    const now = Date.now()
    for (const [roomId, room] of rooms) {
      if (now - room.lastActivity.getTime() > INACTIVE_TIMEOUT_MS) {
        cleanupRoom(roomId)
      }
    }
  }, 5 * 60 * 1000)
}

export function stopRoomCleanup(): void {
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId)
    cleanupIntervalId = null
  }
}

async function cleanupRoom(roomId: string): Promise<void> {
  const room = rooms.get(roomId)
  if (room?.redisStorage) {
    await room.redisStorage.close().catch(() => {})
  }
  rooms.delete(roomId)
  clearRoomPresence(roomId)
  cacheDel(`canvas:room:${roomId}`).catch(() => {})
}

export async function createRoom(
  roomId: string,
  initialSnapshot?: Record<string, unknown>
): Promise<Room> {
  const existing = rooms.get(roomId)
  if (existing) return existing

  // Try Redis first, then DB, then empty
  let snapshot = initialSnapshot
  let redisStorage: RedisSyncStorage | null = null

  try {
    redisStorage = await createRedisSyncStorage(roomId, (recordId, data, type) => {
      // Handle remote updates from other instances via Pub/Sub
      const room = rooms.get(roomId)
      if (!room) return
      if (type === 'put') {
        room.snapshot[recordId] = data
      } else if (type === 'delete') {
        delete room.snapshot[recordId]
      }
      // Broadcast to local WebSocket clients
      broadcastToRoom(roomId, createDiffMessage(
        type === 'put'
          ? { added: { [recordId]: data }, updated: {}, removed: {} }
          : { added: {}, updated: {}, removed: { [recordId]: true } },
        '__remote__',
        'Remote'
      ))
    })

    if (redisStorage && !snapshot) {
      snapshot = await redisStorage.getAll()
      if (Object.keys(snapshot).length === 0) snapshot = undefined
    }
  } catch {
    // Redis unavailable — proceed with in-memory only
  }

  if (!snapshot) {
    snapshot = (await loadSnapshot(roomId)) ?? {}
  }

  const room: Room = {
    id: roomId,
    snapshot,
    users: new Map(),
    lastActivity: new Date(),
    redisStorage,
  }

  rooms.set(roomId, room)
  await cacheSet(`canvas:room:${roomId}`, { active: true }, 3600).catch(() => {})

  return room
}

export async function joinRoom(
  roomId: string,
  userId: string,
  userName: string,
  ws: unknown
): Promise<Room> {
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

  const presences = getAllPresence(roomId)
  broadcastToRoom(roomId, createPresenceMessage(presences), userId)

  if (room.users.size === 0) {
    cleanupRoom(roomId).catch(() => {})
  }
}

export function checkRateLimit(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId)
  if (!room) return false

  const user = room.users.get(userId)
  if (!user) return false

  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS

  if (user.lastMessageTime < windowStart) {
    user.messageCount = 0
    user.lastMessageTime = now
  }

  user.messageCount++

  if (user.messageCount > RATE_LIMIT_MAX_MESSAGES) {
    return false
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

  applyDiffToSnapshot(room.snapshot, diff)
  room.lastActivity = new Date()

  // Persist to Postgres (debounced)
  saveSnapshot(roomId, room.snapshot).catch((err) =>
    console.error('[room-manager] Failed to save snapshot:', err)
  )

  // Persist to Redis + Pub/Sub to other instances
  if (room.redisStorage) {
    persistDiffToRedis(room.redisStorage, diff).catch(() => {})
  }

  const message = createDiffMessage(diff, senderId, senderName)
  broadcastToRoom(roomId, message, senderId)
}

async function persistDiffToRedis(storage: RedisSyncStorage, diff: RecordsDiff): Promise<void> {
  const batch: Record<string, unknown> = { ...diff.added, ...diff.updated }
  if (Object.keys(batch).length > 0) {
    await storage.putBatch(batch)
  }
  for (const key of Object.keys(diff.removed)) {
    await storage.delete(key)
  }
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
  Object.assign(snapshot, diff.added, diff.updated)
  for (const key of Object.keys(diff.removed)) {
    delete snapshot[key]
  }
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId)
}

export function getRoomUserCount(roomId: string): number {
  return rooms.get(roomId)?.users.size ?? 0
}

export function resetRoomManager(): void {
  stopRoomCleanup()
  for (const room of rooms.values()) {
    room.redisStorage?.close().catch(() => {})
  }
  rooms.clear()
}
