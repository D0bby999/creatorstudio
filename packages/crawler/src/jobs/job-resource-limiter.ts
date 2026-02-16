/**
 * Resource limits configuration for crawl jobs
 */
export interface ResourceLimits {
  maxPages?: number
  maxDurationMs?: number
  maxBytes?: number
}

/**
 * Current job statistics for resource limit checking
 */
export interface JobStats {
  pagesCrawled: number
  elapsedMs: number
  bytesDownloaded: number
}

/**
 * Result of resource limit check
 */
export interface ResourceLimitResult {
  stop: boolean
  reason?: string
}

/**
 * Enforces resource limits on crawl jobs to prevent runaway processes.
 * Checks against page count, duration, and bytes downloaded limits.
 */
export class JobResourceLimiter {
  private limits: ResourceLimits

  constructor(limits: ResourceLimits = {}) {
    this.limits = limits
  }

  /**
   * Check if job should stop based on current stats and configured limits
   */
  shouldStop(stats: JobStats): ResourceLimitResult {
    // Check page limit
    if (this.limits.maxPages && stats.pagesCrawled >= this.limits.maxPages) {
      return {
        stop: true,
        reason: `Page limit reached (${this.limits.maxPages} pages)`,
      }
    }

    // Check duration limit
    if (this.limits.maxDurationMs && stats.elapsedMs >= this.limits.maxDurationMs) {
      return {
        stop: true,
        reason: `Duration limit reached (${this.limits.maxDurationMs}ms)`,
      }
    }

    // Check bytes limit
    if (this.limits.maxBytes && stats.bytesDownloaded >= this.limits.maxBytes) {
      return {
        stop: true,
        reason: `Bytes limit reached (${this.limits.maxBytes} bytes)`,
      }
    }

    return { stop: false }
  }

  /**
   * Update resource limits
   */
  setLimits(limits: ResourceLimits): void {
    this.limits = { ...this.limits, ...limits }
  }

  /**
   * Get current limits configuration
   */
  getLimits(): ResourceLimits {
    return { ...this.limits }
  }
}
