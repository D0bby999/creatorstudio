// Presence state management for canvas collaboration
// Tracks cursor positions, selections, and assigns user colors

import type { PresenceData } from './message-protocol'

const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52C18A', // Green
]

interface PresenceState {
  presence: Map<string, PresenceData>
  colorAssignments: Map<string, string>
  nextColorIndex: number
}

const roomPresence = new Map<string, PresenceState>()

function getOrCreateRoomState(roomId: string): PresenceState {
  let state = roomPresence.get(roomId)
  if (!state) {
    state = {
      presence: new Map(),
      colorAssignments: new Map(),
      nextColorIndex: 0,
    }
    roomPresence.set(roomId, state)
  }
  return state
}

export function assignUserColor(roomId: string, userId: string): string {
  const state = getOrCreateRoomState(roomId)

  const existing = state.colorAssignments.get(userId)
  if (existing) return existing

  const color = USER_COLORS[state.nextColorIndex % USER_COLORS.length]
  state.nextColorIndex++
  state.colorAssignments.set(userId, color)

  return color
}

export function updatePresence(
  roomId: string,
  userId: string,
  userName: string,
  update: Omit<PresenceData, 'userId' | 'userName' | 'color'>
): PresenceData {
  const state = getOrCreateRoomState(roomId)
  const color = assignUserColor(roomId, userId)

  const presenceData: PresenceData = {
    userId,
    userName,
    color,
    cursor: update.cursor,
    selectedShapeIds: update.selectedShapeIds,
  }

  state.presence.set(userId, presenceData)
  return presenceData
}

export function getPresence(roomId: string, userId: string): PresenceData | null {
  const state = roomPresence.get(roomId)
  return state?.presence.get(userId) ?? null
}

export function getAllPresence(roomId: string): PresenceData[] {
  const state = roomPresence.get(roomId)
  return state ? Array.from(state.presence.values()) : []
}

export function removePresence(roomId: string, userId: string): void {
  const state = roomPresence.get(roomId)
  if (!state) return

  state.presence.delete(userId)
  state.colorAssignments.delete(userId)

  // Cleanup empty room state
  if (state.presence.size === 0) {
    roomPresence.delete(roomId)
  }
}

export function clearRoomPresence(roomId: string): void {
  roomPresence.delete(roomId)
}

// For testing
export function resetPresenceTracker(): void {
  roomPresence.clear()
}
