/**
 * Pool module exports
 * Provides autoscaled pool with resource monitoring
 */

export { ResourceMonitor } from './resource-monitor.js'
export { AutoscaledPool } from './autoscaled-pool.js'
export type { AutoscaledPoolConfig } from './autoscaled-pool.js'
export { Snapshotter } from './snapshotter.js'
export type { EventLoopSnapshot, MemorySnapshot, SnapshotterConfig } from './snapshotter.js'
