/**
 * Queue ordering strategy interface
 * Determines the order in which requests are processed
 */
export interface QueueStrategy {
  /**
   * Calculate Redis sorted set score for a request
   * @param insertionIndex - Sequential insertion order (0, 1, 2, ...)
   * @returns Score for Redis ZADD (lower scores processed first)
   */
  getScore(insertionIndex: number): number
}

/**
 * Breadth-First Search (FIFO) strategy
 * Processes requests in insertion order
 * Use case: Level-by-level crawling, respecting depth
 */
export class BfsStrategy implements QueueStrategy {
  getScore(insertionIndex: number): number {
    // Lower insertion index = lower score = higher priority
    return insertionIndex
  }
}

/**
 * Depth-First Search (LIFO) strategy
 * Processes newest requests first
 * Use case: Deep crawling, following links immediately
 */
export class DfsStrategy implements QueueStrategy {
  getScore(insertionIndex: number): number {
    // Negative insertion index = newest has lowest score = highest priority
    return -insertionIndex
  }
}

/**
 * Factory function to create queue strategy
 */
export function createQueueStrategy(type: 'bfs' | 'dfs'): QueueStrategy {
  switch (type) {
    case 'bfs':
      return new BfsStrategy()
    case 'dfs':
      return new DfsStrategy()
    default:
      throw new Error(`Unknown queue strategy: ${type}`)
  }
}
