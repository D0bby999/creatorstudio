// Per-platform health tracking with success rates, latency percentiles
// In-memory circular buffer, singleton, sync hot path

import type { CircuitState } from './resilience/circuit-breaker'

interface MetricEntry {
  status: number
  latencyMs: number
  timestamp: number
}

class CircularBuffer<T extends { timestamp: number }> {
  private buffer: (T | undefined)[]
  private head = 0
  private count = 0

  constructor(private capacity: number) {
    this.buffer = new Array(capacity)
  }

  push(item: T): void {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.capacity
    this.count = Math.min(this.count + 1, this.capacity)
  }

  *recent(cutoffTimestamp: number): Generator<T> {
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head - 1 - i + this.capacity) % this.capacity
      const entry = this.buffer[idx]
      if (!entry || entry.timestamp < cutoffTimestamp) break
      yield entry
    }
  }

  clear(): void {
    this.buffer = new Array(this.capacity)
    this.head = 0
    this.count = 0
  }
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

export interface PlatformHealthReport {
  platform: string
  status: HealthStatus
  circuitState: CircuitState
  metrics: {
    successRate: number
    totalRequests: number
    errors: Record<string, number>
    latency: { p50: number; p95: number; p99: number }
  }
  lastUpdated: string
}

export interface HealthReport {
  timestamp: string
  platforms: PlatformHealthReport[]
  overall: HealthStatus
}

interface PlatformTracker {
  entries: CircularBuffer<MetricEntry>
  circuitState: CircuitState
  lastUpdated: number
}

const BUFFER_CAPACITY = 1000
const DEFAULT_WINDOW_MS = 300000 // 5 minutes

export class PlatformHealthTracker {
  private static instance: PlatformHealthTracker
  private trackers = new Map<string, PlatformTracker>()

  static getInstance(): PlatformHealthTracker {
    if (!PlatformHealthTracker.instance) {
      PlatformHealthTracker.instance = new PlatformHealthTracker()
    }
    return PlatformHealthTracker.instance
  }

  record(platform: string, status: number, latencyMs: number): void {
    const tracker = this.getOrCreateTracker(platform)
    tracker.entries.push({ status, latencyMs, timestamp: Date.now() })
    tracker.lastUpdated = Date.now()
  }

  recordCircuitChange(platform: string, state: CircuitState): void {
    const tracker = this.getOrCreateTracker(platform)
    tracker.circuitState = state
  }

  getMetrics(platform: string, windowMs = DEFAULT_WINDOW_MS): PlatformHealthReport {
    const tracker = this.trackers.get(platform)
    if (!tracker) {
      return this.emptyReport(platform)
    }

    const cutoff = Date.now() - windowMs
    const entries: MetricEntry[] = []
    for (const entry of tracker.entries.recent(cutoff)) {
      entries.push(entry)
    }

    if (entries.length === 0) return this.emptyReport(platform, tracker.circuitState)

    const successes = entries.filter(e => e.status >= 200 && e.status < 400).length
    const successRate = (successes / entries.length) * 100
    const latencies = entries.filter(e => e.latencyMs > 0).map(e => e.latencyMs)

    const errors: Record<string, number> = {}
    for (const e of entries) {
      if (e.status === 429) errors.rateLimit = (errors.rateLimit ?? 0) + 1
      else if (e.status === 401 || e.status === 403) errors.auth = (errors.auth ?? 0) + 1
      else if (e.status >= 500) errors.platform = (errors.platform ?? 0) + 1
      else if (e.status >= 400) errors.client = (errors.client ?? 0) + 1
      else if (e.status === 0) errors.network = (errors.network ?? 0) + 1
    }

    return {
      platform,
      status: deriveHealthStatus(successRate),
      circuitState: tracker.circuitState,
      metrics: {
        successRate: Math.round(successRate * 100) / 100,
        totalRequests: entries.length,
        errors,
        latency: computePercentiles(latencies),
      },
      lastUpdated: new Date(tracker.lastUpdated).toISOString(),
    }
  }

  getHealthReport(windowMs = DEFAULT_WINDOW_MS): HealthReport {
    const platforms = [...this.trackers.keys()].map(p => this.getMetrics(p, windowMs))
    const worstStatus = platforms.reduce<HealthStatus>(
      (worst, p) => HEALTH_PRIORITY[p.status] > HEALTH_PRIORITY[worst] ? p.status : worst,
      'healthy'
    )

    return {
      timestamp: new Date().toISOString(),
      platforms,
      overall: platforms.length === 0 ? 'unknown' : worstStatus,
    }
  }

  reset(): void {
    this.trackers.clear()
  }

  private getOrCreateTracker(platform: string): PlatformTracker {
    let tracker = this.trackers.get(platform)
    if (!tracker) {
      tracker = {
        entries: new CircularBuffer(BUFFER_CAPACITY),
        circuitState: 'closed',
        lastUpdated: Date.now(),
      }
      this.trackers.set(platform, tracker)
    }
    return tracker
  }

  private emptyReport(platform: string, circuitState: CircuitState = 'closed'): PlatformHealthReport {
    return {
      platform,
      status: 'unknown',
      circuitState,
      metrics: {
        successRate: 0,
        totalRequests: 0,
        errors: {},
        latency: { p50: 0, p95: 0, p99: 0 },
      },
      lastUpdated: new Date().toISOString(),
    }
  }
}

const HEALTH_PRIORITY: Record<HealthStatus, number> = {
  healthy: 0, unknown: 1, degraded: 2, unhealthy: 3,
}

function deriveHealthStatus(successRate: number): HealthStatus {
  if (successRate >= 95) return 'healthy'
  if (successRate >= 80) return 'degraded'
  return 'unhealthy'
}

function computePercentiles(values: number[]): { p50: number; p95: number; p99: number } {
  if (values.length === 0) return { p50: 0, p95: 0, p99: 0 }
  const sorted = values.slice().sort((a, b) => a - b)
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
  }
}
