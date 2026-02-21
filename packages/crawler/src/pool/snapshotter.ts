/**
 * Event loop + memory monitoring for autoscaling decisions
 * Measures event loop lag and memory usage at regular intervals
 * Provides sliding-window samples for AutoscaledPool scaling logic
 */

import * as os from 'node:os'

export interface EventLoopSnapshot {
  createdAt: number
  isOverloaded: boolean
  exceededMillis: number
}

export interface MemorySnapshot {
  createdAt: number
  isOverloaded: boolean
  usedBytes: number
  totalBytes: number
  usedRatio: number
}

export interface SnapshotterConfig {
  eventLoopSnapshotIntervalMs?: number
  maxBlockedMillis?: number
  maxUsedMemoryRatio?: number
  snapshotHistoryMs?: number
}

export class Snapshotter {
  private eventLoopSnaps: EventLoopSnapshot[] = []
  private memorySnaps: MemorySnapshot[] = []
  private intervalHandle?: ReturnType<typeof setInterval>
  private lastTickTime?: number
  private config: Required<SnapshotterConfig>

  constructor(config: SnapshotterConfig = {}) {
    this.config = {
      eventLoopSnapshotIntervalMs: config.eventLoopSnapshotIntervalMs ?? 500,
      maxBlockedMillis: config.maxBlockedMillis ?? 50,
      maxUsedMemoryRatio: config.maxUsedMemoryRatio ?? 0.9,
      snapshotHistoryMs: config.snapshotHistoryMs ?? 30000,
    }
  }

  start(): void {
    this.intervalHandle = setInterval(() => {
      this.snapshotEventLoop()
      this.snapshotMemory()
      this.pruneOld()
    }, this.config.eventLoopSnapshotIntervalMs)
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = undefined
    }
  }

  getEventLoopSample(durationMs = 5000): EventLoopSnapshot[] {
    const cutoff = Date.now() - durationMs
    return this.eventLoopSnaps.filter((s) => s.createdAt >= cutoff)
  }

  getMemorySample(durationMs = 5000): MemorySnapshot[] {
    const cutoff = Date.now() - durationMs
    return this.memorySnaps.filter((s) => s.createdAt >= cutoff)
  }

  isEventLoopOverloaded(sampleMs = 5000, threshold = 0.5): boolean {
    const sample = this.getEventLoopSample(sampleMs)
    if (sample.length === 0) return false
    const overloaded = sample.filter((s) => s.isOverloaded).length
    return overloaded / sample.length > threshold
  }

  isMemoryOverloaded(sampleMs = 5000, threshold = 0.5): boolean {
    const sample = this.getMemorySample(sampleMs)
    if (sample.length === 0) return false
    const overloaded = sample.filter((s) => s.isOverloaded).length
    return overloaded / sample.length > threshold
  }

  private snapshotEventLoop(): void {
    const now = Date.now()

    if (this.lastTickTime === undefined) {
      this.lastTickTime = now
      return
    }

    const expected = this.config.eventLoopSnapshotIntervalMs
    const actual = now - this.lastTickTime
    const delta = actual - expected
    const exceeded = Math.max(0, delta - this.config.maxBlockedMillis)

    this.eventLoopSnaps.push({
      createdAt: now,
      isOverloaded: delta > this.config.maxBlockedMillis,
      exceededMillis: exceeded,
    })

    this.lastTickTime = now
  }

  private snapshotMemory(): void {
    const usedBytes = process.memoryUsage().heapUsed
    const totalBytes = os.totalmem()
    const usedRatio = usedBytes / totalBytes

    this.memorySnaps.push({
      createdAt: Date.now(),
      isOverloaded: usedRatio > this.config.maxUsedMemoryRatio,
      usedBytes,
      totalBytes,
      usedRatio,
    })
  }

  private pruneOld(): void {
    const cutoff = Date.now() - this.config.snapshotHistoryMs
    this.eventLoopSnaps = this.eventLoopSnaps.filter((s) => s.createdAt >= cutoff)
    this.memorySnaps = this.memorySnaps.filter((s) => s.createdAt >= cutoff)
  }
}
