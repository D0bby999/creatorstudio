import type {
  EnhancedCrawlJob,
  PriorityLevel,
  CrawlerEngineConfig,
} from '../types/crawler-types.js'
import { cacheGet, cacheSet, cacheGetByPrefix } from '@creator-studio/redis/cache'
import { JobProgressTracker } from './job-progress-tracker.js'

const JOB_PREFIX = 'crawler:enhanced-job:'
const JOB_TTL = 604800 // 7 days

export interface CreateJobConfig {
  url: string
  type: string
  config?: Partial<CrawlerEngineConfig>
  priority?: PriorityLevel
  userId: string
  templateId?: string
}

export interface JobFilters {
  status?: string
  priority?: PriorityLevel
}

/**
 * Enhanced job manager with priority, retry logic, and progress tracking.
 * Supports job lifecycle: create, pause, resume, cancel, retry.
 */
export class EnhancedJobManager {
  private progressTracker: JobProgressTracker

  constructor() {
    this.progressTracker = new JobProgressTracker()
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return crypto.randomUUID()
  }

  /**
   * Create a new crawl job
   */
  async createJob(config: CreateJobConfig): Promise<EnhancedCrawlJob> {
    const now = new Date().toISOString()
    const job: EnhancedCrawlJob = {
      id: this.generateJobId(),
      url: config.url,
      type: config.type,
      status: 'pending',
      config: config.config,
      priority: config.priority ?? 'normal',
      retryCount: 0,
      maxRetries: 3,
      userId: config.userId,
      templateId: config.templateId,
      createdAt: now,
      updatedAt: now,
    }

    await cacheSet(`${JOB_PREFIX}${job.id}`, job, JOB_TTL)
    return job
  }

  /**
   * Get a job by ID with progress data
   */
  async getJob(jobId: string): Promise<EnhancedCrawlJob | null> {
    const job = await cacheGet<EnhancedCrawlJob>(`${JOB_PREFIX}${jobId}`)
    if (!job) return null

    // Attach progress if available
    const progress = await this.progressTracker.getProgress(jobId)
    if (progress) {
      job.progress = progress
    }

    return job
  }

  /**
   * List all jobs for a user with optional filters
   */
  async listJobs(userId: string, filters?: JobFilters): Promise<EnhancedCrawlJob[]> {
    const allJobs = await cacheGetByPrefix<EnhancedCrawlJob>(JOB_PREFIX)
    let jobs = allJobs.filter((j) => j.userId === userId)

    if (filters?.status) {
      jobs = jobs.filter((j) => j.status === filters.status)
    }

    if (filters?.priority) {
      jobs = jobs.filter((j) => j.priority === filters.priority)
    }

    // Sort by creation time (newest first)
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Attach progress data
    for (const job of jobs) {
      const progress = await this.progressTracker.getProgress(job.id)
      if (progress) {
        job.progress = progress
      }
    }

    return jobs
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId)
    if (!job) return

    job.status = 'cancelled'
    job.updatedAt = new Date().toISOString()
    job.completedAt = job.completedAt ?? job.updatedAt

    await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)
  }

  /**
   * Pause a running job
   */
  async pauseJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId)
    if (!job || job.status !== 'running') return

    job.status = 'paused'
    job.updatedAt = new Date().toISOString()

    await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)
  }

  /**
   * Resume a paused job
   */
  async resumeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId)
    if (!job || job.status !== 'paused') return

    job.status = 'running'
    job.updatedAt = new Date().toISOString()

    await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)
  }

  /**
   * Retry a failed job (creates new job with same config)
   */
  async retryJob(jobId: string): Promise<EnhancedCrawlJob> {
    const originalJob = await this.getJob(jobId)
    if (!originalJob) {
      throw new Error(`Job ${jobId} not found`)
    }

    return await this.createJob({
      url: originalJob.url,
      type: originalJob.type,
      config: originalJob.config,
      priority: originalJob.priority,
      userId: originalJob.userId,
      templateId: originalJob.templateId,
    })
  }

  /**
   * Update job status and metadata
   */
  async updateJob(jobId: string, updates: Partial<EnhancedCrawlJob>): Promise<void> {
    const job = await this.getJob(jobId)
    if (!job) return

    Object.assign(job, updates)
    job.updatedAt = new Date().toISOString()

    await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)
  }
}
