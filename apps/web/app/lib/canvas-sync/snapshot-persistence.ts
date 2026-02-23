// Canvas snapshot persistence with debouncing and compression
// Saves snapshots to PostgreSQL via Prisma

import { prisma } from '@creator-studio/db'

interface PendingSave {
  snapshot: Record<string, unknown>
  timeoutId: NodeJS.Timeout
}

const pendingSaves = new Map<string, PendingSave>()
const DEBOUNCE_MS = 30_000 // 30 seconds

export async function saveSnapshot(
  roomId: string,
  snapshot: Record<string, unknown>
): Promise<void> {
  // Cancel pending save for this room
  const pending = pendingSaves.get(roomId)
  if (pending) {
    clearTimeout(pending.timeoutId)
  }

  // Schedule debounced save
  const timeoutId = setTimeout(async () => {
    pendingSaves.delete(roomId)
    await flushSnapshot(roomId, snapshot)
  }, DEBOUNCE_MS)

  pendingSaves.set(roomId, { snapshot, timeoutId })
}

async function flushSnapshot(
  roomId: string,
  snapshot: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.canvasRoom.update({
      where: { id: roomId },
      data: {
        snapshot,
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[snapshot-persistence] Failed to save snapshot:', error)
    throw error
  }
}

export async function loadSnapshot(roomId: string): Promise<Record<string, unknown> | null> {
  try {
    const room = await prisma.canvasRoom.findUnique({
      where: { id: roomId },
      select: { snapshot: true },
    })

    if (!room?.snapshot) return null

    // Prisma Json type is unknown, validate it's an object
    if (typeof room.snapshot !== 'object' || room.snapshot === null || Array.isArray(room.snapshot)) {
      console.error('[snapshot-persistence] Invalid snapshot format in DB')
      return null
    }

    return room.snapshot as Record<string, unknown>
  } catch (error) {
    console.error('[snapshot-persistence] Failed to load snapshot:', error)
    return null
  }
}

export async function flushPendingSave(roomId: string): Promise<void> {
  const pending = pendingSaves.get(roomId)
  if (!pending) return

  clearTimeout(pending.timeoutId)
  pendingSaves.delete(roomId)
  await flushSnapshot(roomId, pending.snapshot)
}

export async function flushAllPendingSaves(): Promise<void> {
  const saves = Array.from(pendingSaves.entries()).map(([roomId, { snapshot }]) =>
    flushSnapshot(roomId, snapshot)
  )

  pendingSaves.forEach((pending) => clearTimeout(pending.timeoutId))
  pendingSaves.clear()

  await Promise.allSettled(saves)
}

// Cleanup on shutdown (for graceful termination)
if (typeof process !== 'undefined') {
  const cleanup = () => {
    flushAllPendingSaves().catch((err) =>
      console.error('[snapshot-persistence] Cleanup failed:', err)
    )
  }

  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
}

// For testing
export function resetPersistence(): void {
  pendingSaves.forEach((pending) => clearTimeout(pending.timeoutId))
  pendingSaves.clear()
}
