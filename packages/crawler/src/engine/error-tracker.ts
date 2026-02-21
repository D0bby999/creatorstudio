/**
 * Error grouping with signature-based deduplication
 * Groups by: stack trace → error code → error name → error message
 * Placeholder merging: "Timeout after 5000ms" + "Timeout after 3000ms" → "Timeout after _ms"
 */

import type { ErrorSnapshotter, ErrorSnapshot } from './error-snapshotter.js'

export interface ErrorTrackerConfig {
  showStackTrace?: boolean
  showErrorCode?: boolean
  showErrorName?: boolean
  showErrorMessage?: boolean
  showFullMessage?: boolean
  maxSnapshots?: number
}

export interface ErrorGroup {
  count: number
  firstOccurrence: Date
  lastOccurrence: Date
  snapshotUrl?: string
  htmlUrl?: string
}

export interface ErrorContext {
  url: string
  page?: unknown
  html?: string
}

export class ErrorTracker {
  private errors = new Map<string, ErrorGroup>()
  private total = 0
  private snapshotCount = 0
  private config: Required<ErrorTrackerConfig>
  private snapshotter?: ErrorSnapshotter

  constructor(config: ErrorTrackerConfig = {}, snapshotter?: ErrorSnapshotter) {
    this.config = {
      showStackTrace: config.showStackTrace ?? true,
      showErrorCode: config.showErrorCode ?? true,
      showErrorName: config.showErrorName ?? true,
      showErrorMessage: config.showErrorMessage ?? true,
      showFullMessage: config.showFullMessage ?? false,
      maxSnapshots: config.maxSnapshots ?? 10,
    }
    this.snapshotter = snapshotter
  }

  async add(error: Error, context: ErrorContext): Promise<void> {
    this.total++
    const signature = this.generateSignature(error)
    const existing = this.errors.get(signature)

    if (existing) {
      existing.count++
      existing.lastOccurrence = new Date()
      return
    }

    const group: ErrorGroup = {
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
    }

    // Capture snapshot on first occurrence
    if (
      this.snapshotter &&
      context.page &&
      this.snapshotCount < this.config.maxSnapshots
    ) {
      try {
        const snapshot = await this.snapshotter.capture(
          context.page,
          context.url,
          error.message
        )
        if (snapshot) {
          group.snapshotUrl = snapshot.screenshotUrl
          group.htmlUrl = snapshot.htmlUrl
          this.snapshotCount++
        }
      } catch {
        // Non-blocking — don't fail crawl for snapshot errors
      }
    }

    this.errors.set(signature, group)
  }

  getUniqueErrorCount(): number {
    return this.errors.size
  }

  getTotalErrors(): number {
    return this.total
  }

  getMostPopularErrors(
    limit = 10
  ): Array<{ signature: string; count: number; snapshot?: string }> {
    return Array.from(this.errors.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([signature, group]) => ({
        signature,
        count: group.count,
        snapshot: group.snapshotUrl,
      }))
  }

  getStats() {
    return {
      total: this.total,
      unique: this.errors.size,
      snapshots: this.snapshotCount,
    }
  }

  private generateSignature(error: Error): string {
    const parts: string[] = []

    if (this.config.showStackTrace) {
      const stackLine = this.extractStackLine(error.stack ?? '')
      if (stackLine) parts.push(stackLine)
    }

    if (this.config.showErrorCode && 'code' in error) {
      parts.push(String((error as any).code))
    }

    if (this.config.showErrorName) {
      parts.push(error.name)
    }

    if (this.config.showErrorMessage) {
      const message = this.config.showFullMessage
        ? error.message
        : error.message.split('\n')[0]
      parts.push(this.normalizeMessage(message))
    }

    return parts.join(' > ')
  }

  private extractStackLine(stack: string): string | null {
    const lines = stack.split('\n')
    for (const line of lines) {
      if (line.includes('node_modules')) continue
      const match = line.match(/at .+\((.+):(\d+):(\d+)\)/)
      if (match) return `${match[1]}:${match[2]}`
    }
    return null
  }

  /**
   * Normalize numeric values in error messages for grouping
   * "Timeout after 5000ms" → "Timeout after _ms"
   */
  private normalizeMessage(message: string): string {
    return message.replace(/\b\d+\b/g, '_')
  }
}
