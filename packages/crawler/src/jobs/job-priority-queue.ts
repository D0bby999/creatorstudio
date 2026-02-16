import type { EnhancedCrawlJob, PriorityLevel } from '../types/crawler-types.js'

/**
 * Maps priority level to numeric value for sorting
 */
function priorityToNumber(level: PriorityLevel): number {
  const priorities: Record<PriorityLevel, number> = {
    urgent: 3,
    high: 2,
    normal: 1,
    low: 0,
  }
  return priorities[level]
}

/**
 * Manages job priority queue for crawl jobs.
 * Jobs are sorted by priority level (urgent > high > normal > low)
 * and creation time (older jobs first within same priority).
 */
export class JobPriorityQueue {
  /**
   * Sort jobs by priority (highest first) then by creation time (oldest first)
   */
  sortByPriority(jobs: EnhancedCrawlJob[]): EnhancedCrawlJob[] {
    return [...jobs].sort((a, b) => {
      const priorityDiff = priorityToNumber(b.priority) - priorityToNumber(a.priority)
      if (priorityDiff !== 0) return priorityDiff

      // Same priority - sort by creation time (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  /**
   * Get next job to execute (highest priority pending job)
   */
  getNextJob(jobs: EnhancedCrawlJob[]): EnhancedCrawlJob | null {
    const pendingJobs = jobs.filter((j) => j.status === 'pending')
    if (pendingJobs.length === 0) return null

    const sorted = this.sortByPriority(pendingJobs)
    return sorted[0] ?? null
  }

  /**
   * Filter jobs by priority level
   */
  filterByPriority(jobs: EnhancedCrawlJob[], priority: PriorityLevel): EnhancedCrawlJob[] {
    return jobs.filter((j) => j.priority === priority)
  }

  /**
   * Get job counts by priority level
   */
  getPriorityCounts(jobs: EnhancedCrawlJob[]): Record<PriorityLevel, number> {
    const counts: Record<PriorityLevel, number> = {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0,
    }

    for (const job of jobs) {
      counts[job.priority]++
    }

    return counts
  }
}
