/** Presence data types and color utilities for collaboration UI */

export interface PresenceData {
  userId: string
  userName: string
  cursor: { x: number; y: number } | null
  selectedShapeIds: string[]
  color: string
}

const PRESENCE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
]

export function assignColor(index: number): string {
  return PRESENCE_COLORS[index % PRESENCE_COLORS.length]
}

export function formatUserName(name: string, maxLen = 12): string {
  if (name.length <= maxLen) return name
  return name.slice(0, maxLen - 1) + '...'
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
