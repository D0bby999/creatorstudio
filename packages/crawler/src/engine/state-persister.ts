/**
 * Crash recovery via Redis state persistence
 * Persists queue + crawler state every N seconds
 * SIGTERM/SIGINT handlers for graceful shutdown
 * Redis-only — graceful no-op if Redis unavailable (serverless)
 */

import { getRedis } from '@creator-studio/redis'

export interface CrawlerState {
  queueId: string
  lastProcessedUrl: string | null
  phase: string
  totalRequests: number
  completedRequests: number
  failedRequests: number
  timestamp: number
}

export interface StatePersisterConfig {
  persistIntervalMs?: number
}

const STATE_TTL = 86400 // 24h

// Module-level guard to prevent duplicate handlers
let globalSignalHandlersRegistered = false
let globalShutdownCallback: (() => Promise<void>) | undefined
let sigTermHandler: (() => void) | undefined
let sigIntHandler: (() => void) | undefined

export class StatePersister {
  private persistIntervalMs: number
  private intervalHandle?: ReturnType<typeof setInterval>

  constructor(config: StatePersisterConfig = {}) {
    this.persistIntervalMs = config.persistIntervalMs ?? 60000
  }

  async persist(state: CrawlerState, queueState: unknown): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    const stateKey = `crawler:state:${state.queueId}`
    const queueKey = `crawler:queue:${state.queueId}`

    try {
      await Promise.all([
        redis.set(stateKey, JSON.stringify(state), { ex: STATE_TTL }),
        redis.set(queueKey, JSON.stringify(queueState), { ex: STATE_TTL }),
      ])
    } catch (err) {
      console.error('[StatePersister] persist failed:', err)
    }
  }

  async restore(
    queueId: string
  ): Promise<{ state: CrawlerState; queueState: unknown } | null> {
    const redis = getRedis()
    if (!redis) return null

    const stateKey = `crawler:state:${queueId}`
    const queueKey = `crawler:queue:${queueId}`

    try {
      const [stateStr, queueStr] = await Promise.all([
        redis.get<string>(stateKey),
        redis.get<string>(queueKey),
      ])

      if (!stateStr || !queueStr) return null

      return {
        state: typeof stateStr === 'string' ? JSON.parse(stateStr) : stateStr,
        queueState: typeof queueStr === 'string' ? JSON.parse(queueStr) : queueStr,
      }
    } catch {
      return null
    }
  }

  async cleanup(queueId: string): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    await redis.del(`crawler:state:${queueId}`, `crawler:queue:${queueId}`)
  }

  startPeriodicPersist(persistFn: () => Promise<void>): void {
    this.intervalHandle = setInterval(() => {
      persistFn().catch((err) =>
        console.error('[StatePersister] periodic persist failed:', err)
      )
    }, this.persistIntervalMs)
  }

  stopPeriodicPersist(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = undefined
    }
  }

  registerShutdownHook(callback: () => Promise<void>): void {
    if (globalSignalHandlersRegistered) {
      // Just update the callback reference
      globalShutdownCallback = callback
      return
    }

    globalShutdownCallback = callback

    const shutdown = async (signal: string) => {
      console.log(`[StatePersister] ${signal} received, persisting state...`)
      this.stopPeriodicPersist()
      try {
        await globalShutdownCallback?.()
      } catch (err) {
        console.error('[StatePersister] shutdown persist failed:', err)
      }
      // Don't call process.exit() — let the caller decide
    }

    sigTermHandler = () => { shutdown('SIGTERM') }
    sigIntHandler = () => { shutdown('SIGINT') }

    process.on('SIGTERM', sigTermHandler)
    process.on('SIGINT', sigIntHandler)
    globalSignalHandlersRegistered = true
  }

  removeShutdownHook(): void {
    if (sigTermHandler) process.removeListener('SIGTERM', sigTermHandler)
    if (sigIntHandler) process.removeListener('SIGINT', sigIntHandler)
    sigTermHandler = undefined
    sigIntHandler = undefined
    globalShutdownCallback = undefined
    globalSignalHandlersRegistered = false
  }
}
