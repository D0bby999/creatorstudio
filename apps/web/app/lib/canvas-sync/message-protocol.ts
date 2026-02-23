// Type-safe WebSocket message protocol for canvas collaboration
// Defines client/server message types with Zod validation

import { z } from 'zod'

// ─── Type Definitions ───

export interface RecordsDiff {
  added: Record<string, unknown>
  updated: Record<string, unknown>
  removed: Record<string, boolean>
}

export interface PresenceData {
  userId: string
  userName: string
  cursor: { x: number; y: number } | null
  selectedShapeIds: string[]
  color: string
}

export type ErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'NOT_AUTHENTICATED'
  | 'RATE_LIMITED'
  | 'INVALID_MESSAGE'
  | 'INTERNAL_ERROR'

// ─── Client Messages ───

export type ClientMessage =
  | { type: 'diff'; data: RecordsDiff }
  | { type: 'presence'; data: Omit<PresenceData, 'userId' | 'userName' | 'color'> }
  | { type: 'ping' }

// ─── Server Messages ───

export type ServerMessage =
  | { type: 'snapshot'; data: Record<string, unknown> }
  | { type: 'diff'; data: RecordsDiff; userId: string; userName: string }
  | { type: 'presence'; data: PresenceData[] }
  | { type: 'error'; code: ErrorCode; message: string }
  | { type: 'pong' }

// ─── Zod Schemas ───

const RecordsDiffSchema = z.object({
  added: z.record(z.unknown()),
  updated: z.record(z.unknown()),
  removed: z.record(z.boolean()),
})

const PresenceDataSchema = z.object({
  cursor: z.object({ x: z.number(), y: z.number() }).nullable(),
  selectedShapeIds: z.array(z.string()),
})

export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('diff'), data: RecordsDiffSchema }),
  z.object({ type: z.literal('presence'), data: PresenceDataSchema }),
  z.object({ type: z.literal('ping') }),
])

// ─── Message Builders ───

export function createSnapshotMessage(snapshot: Record<string, unknown>): ServerMessage {
  return { type: 'snapshot', data: snapshot }
}

export function createDiffMessage(
  diff: RecordsDiff,
  userId: string,
  userName: string
): ServerMessage {
  return { type: 'diff', data: diff, userId, userName }
}

export function createPresenceMessage(presences: PresenceData[]): ServerMessage {
  return { type: 'presence', data: presences }
}

export function createErrorMessage(code: ErrorCode, message: string): ServerMessage {
  return { type: 'error', code, message }
}

export function createPongMessage(): ServerMessage {
  return { type: 'pong' }
}

// ─── Validation Helpers ───

export function parseClientMessage(raw: unknown): ClientMessage | null {
  const result = ClientMessageSchema.safeParse(raw)
  if (!result.success) return null
  return result.data as ClientMessage
}

export function isValidSnapshot(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
}
