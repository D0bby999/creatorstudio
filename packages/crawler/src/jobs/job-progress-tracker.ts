import type { JobProgress } from '../types/crawler-types.js'
import { cacheGet, cacheSet } from '@creator-studio/redis/cache'

const PROGRESS_PREFIX = 'crawler:progress:'
const PROGRESS_TTL = 86400 // 24 hours

/**
 * Tracks crawl job progress in Redis with in-memory fallback.
 * Progress data includes pages crawled, current URL, elapsed time,
 * estimated remaining time, and bytes downloaded.
 */
export class JobProgressTracker {
  /**
   * Update progress for a crawl job
   */
  async updateProgress(jobId: string, progress: JobProgress): Promise<void> {
    const key = `${PROGRESS_PREFIX}${jobId}`
    await cacheSet(key, progress, PROGRESS_TTL)
  }

  /**
   * Get current progress for a crawl job
   */
  async getProgress(jobId: string): Promise<JobProgress | null> {
    const key = `${PROGRESS_PREFIX}${jobId}`
    return await cacheGet<JobProgress>(key)
  }

  /**
   * Calculate estimated remaining time based on current progress
   */
  calculateEstimatedTime(
    pagesCrawled: number,
    pagesTotal: number,
    elapsedMs: number
  ): number {
    if (pagesCrawled === 0) return 0
    const avgTimePerPage = elapsedMs / pagesCrawled
    const pagesRemaining = Math.max(0, pagesTotal - pagesCrawled)
    return Math.round(avgTimePerPage * pagesRemaining)
  }

  /**
   * Create initial progress entry for a new job
   */
  async initializeProgress(jobId: string, pagesTotal: number): Promise<void> {
    const progress: JobProgress = {
      pagesCrawled: 0,
      pagesTotal,
      currentUrl: '',
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      bytesDownloaded: 0,
    }
    await this.updateProgress(jobId, progress)
  }

  /**
   * Increment pages crawled and update current URL
   */
  async incrementProgress(
    jobId: string,
    currentUrl: string,
    bytesDownloaded: number,
    elapsedMs: number
  ): Promise<void> {
    const current = await this.getProgress(jobId)
    if (!current) return

    const pagesCrawled = current.pagesCrawled + 1
    const estimatedRemainingMs = this.calculateEstimatedTime(
      pagesCrawled,
      current.pagesTotal,
      elapsedMs
    )

    const updated: JobProgress = {
      ...current,
      pagesCrawled,
      currentUrl,
      bytesDownloaded: current.bytesDownloaded + bytesDownloaded,
      elapsedMs,
      estimatedRemainingMs,
    }

    await this.updateProgress(jobId, updated)
  }
}
