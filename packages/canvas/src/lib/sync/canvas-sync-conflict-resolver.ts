/** Basic timestamp-based conflict resolution for concurrent edits */

export interface ConflictResolutionResult<T = unknown> {
  /** Whether conflict was detected */
  hasConflict: boolean
  /** Resolved value (winning operation) */
  resolved: T
  /** Conflict resolution strategy used */
  strategy: 'local-wins' | 'remote-wins' | 'last-write-wins'
}

export interface VersionedOperation<T = unknown> {
  /** Operation data */
  data: T
  /** Timestamp when operation occurred */
  timestamp: number
  /** User/session identifier */
  userId: string
}

/**
 * Simple last-write-wins conflict resolver.
 * Production systems should use CRDTs or operational transformation.
 */
export class ConflictResolver {
  /**
   * Resolve conflict between local and remote operations using timestamps.
   * Returns the operation with the latest timestamp.
   */
  resolve<T>(
    local: VersionedOperation<T>,
    remote: VersionedOperation<T>
  ): ConflictResolutionResult<T> {
    // No conflict if from same user
    if (local.userId === remote.userId) {
      return {
        hasConflict: false,
        resolved: remote.data,
        strategy: 'remote-wins',
      }
    }

    // Last-write-wins based on timestamp
    if (remote.timestamp > local.timestamp) {
      return {
        hasConflict: true,
        resolved: remote.data,
        strategy: 'last-write-wins',
      }
    }

    if (local.timestamp > remote.timestamp) {
      return {
        hasConflict: true,
        resolved: local.data,
        strategy: 'last-write-wins',
      }
    }

    // Tie-breaker: remote wins for stability
    return {
      hasConflict: true,
      resolved: remote.data,
      strategy: 'remote-wins',
    }
  }

  /**
   * Batch resolve conflicts for multiple operations.
   * Returns operations sorted by timestamp (oldest first).
   */
  resolveBatch<T>(
    operations: VersionedOperation<T>[]
  ): VersionedOperation<T>[] {
    return [...operations].sort((a, b) => a.timestamp - b.timestamp)
  }
}
