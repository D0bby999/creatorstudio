import * as os from 'node:os'

/**
 * System resource snapshot with memory usage
 */
interface ResourceSnapshot {
  memoryRatio: number
  timestamp: number
}

/**
 * Configuration for ResourceMonitor
 */
interface ResourceMonitorConfig {
  maxMemoryRatio?: number
  snapshotIntervalMs?: number
  maxSnapshotAge?: number
}

/**
 * Lightweight system metric sampling with weighted-time-averaging
 * Monitors process memory usage relative to system total
 */
export class ResourceMonitor {
  private snapshots: ResourceSnapshot[] = []
  private intervalId: ReturnType<typeof setInterval> | null = null
  private maxMemoryRatio: number
  private snapshotIntervalMs: number
  private maxSnapshotAge: number

  constructor(opts: ResourceMonitorConfig = {}) {
    this.maxMemoryRatio = opts.maxMemoryRatio ?? 0.7
    this.snapshotIntervalMs = opts.snapshotIntervalMs ?? 1000
    this.maxSnapshotAge = opts.maxSnapshotAge ?? 5000
  }

  /**
   * Start periodic resource sampling
   */
  start(): void {
    if (this.intervalId) return

    // Take initial snapshot
    this.takeSnapshot()

    // Schedule periodic snapshots
    this.intervalId = setInterval(() => {
      this.takeSnapshot()
    }, this.snapshotIntervalMs)
  }

  /**
   * Stop periodic sampling and clear interval
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Check if system is overloaded using weighted time averaging
   * More recent snapshots have more weight (longer time interval)
   * @returns true if weighted average memory ratio exceeds threshold
   */
  isOverloaded(): boolean {
    this.cleanOldSnapshots()

    if (this.snapshots.length === 0) return false
    if (this.snapshots.length === 1) {
      return this.snapshots[0].memoryRatio > this.maxMemoryRatio
    }

    // Calculate weighted time average
    let totalWeightedRatio = 0
    let totalWeight = 0

    for (let i = 1; i < this.snapshots.length; i++) {
      const current = this.snapshots[i]
      const previous = this.snapshots[i - 1]

      // Weight = time interval between consecutive snapshots
      const weight = current.timestamp - previous.timestamp

      totalWeightedRatio += current.memoryRatio * weight
      totalWeight += weight
    }

    const weightedAverage = totalWeight > 0 ? totalWeightedRatio / totalWeight : 0
    return weightedAverage > this.maxMemoryRatio
  }

  /**
   * Get current resource snapshot
   */
  getSnapshot(): { memoryRatio: number } {
    const memoryRatio = this.calculateMemoryRatio()
    return { memoryRatio }
  }

  /**
   * Take a resource snapshot and add to history
   */
  private takeSnapshot(): void {
    const memoryRatio = this.calculateMemoryRatio()
    this.snapshots.push({
      memoryRatio,
      timestamp: Date.now(),
    })
    this.cleanOldSnapshots()
  }

  /**
   * Remove snapshots older than maxSnapshotAge
   */
  private cleanOldSnapshots(): void {
    const now = Date.now()
    this.snapshots = this.snapshots.filter(
      (snapshot) => now - snapshot.timestamp <= this.maxSnapshotAge
    )
  }

  /**
   * Calculate process memory ratio (process memory / system total)
   */
  private calculateMemoryRatio(): number {
    const processMemory = process.memoryUsage().heapUsed
    const totalMemory = os.totalmem()
    return processMemory / totalMemory
  }
}
