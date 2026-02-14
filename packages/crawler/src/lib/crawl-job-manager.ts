import type { CrawlJob, ScrapedContent, SeoReport } from '../types/crawler-types'
import { smartScrape } from './smart-scraper'
import { analyzeSeo } from './seo-analyzer'
import { cacheGet, cacheSet, cacheDel, cacheGetByPrefix } from '@creator-studio/redis/cache'

const JOB_PREFIX = 'crawler:job:'
const JOB_TTL = 604800 // 7 days

/**
 * Generates unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Send crawl job event to Inngest for background execution
 */
async function sendCrawlJobEvent(jobId: string, url: string, type: 'url' | 'seo'): Promise<void> {
  // Skip if INNGEST_EVENT_KEY not configured (fall back to direct execution)
  if (!process.env.INNGEST_EVENT_KEY) {
    return
  }

  try {
    const response = await fetch('https://inn.gs/e/creator-studio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INNGEST_EVENT_KEY}`,
      },
      body: JSON.stringify({
        name: 'crawler/job.created',
        data: { jobId, url, type },
      }),
    })

    if (!response.ok) {
      throw new Error(`Inngest API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to send Inngest event:', error)
    // Fall back to direct execution
    throw error
  }
}

/**
 * Creates and executes a crawl job
 */
export async function createJob(
  url: string,
  type: 'url' | 'seo'
): Promise<CrawlJob> {
  const jobId = generateJobId()
  const job: CrawlJob = {
    id: jobId,
    url,
    type,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)

  // Try to send to Inngest first, fall back to direct execution
  try {
    await sendCrawlJobEvent(jobId, url, type)
  } catch {
    // Inngest unavailable, execute directly
    executeJob(jobId).catch(async (error) => {
      const failedJob = await cacheGet<CrawlJob>(`${JOB_PREFIX}${jobId}`)
      if (failedJob) {
        failedJob.status = 'failed'
        failedJob.error = error instanceof Error ? error.message : 'Unknown error'
        failedJob.completedAt = new Date().toISOString()
        await cacheSet(`${JOB_PREFIX}${jobId}`, failedJob, JOB_TTL)
      }
    })
  }

  return job
}

/**
 * Executes a crawl job
 */
async function executeJob(jobId: string): Promise<void> {
  const job = await cacheGet<CrawlJob>(`${JOB_PREFIX}${jobId}`)
  if (!job) return

  job.status = 'running'
  await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)

  try {
    const content = await smartScrape(job.url)

    if (job.type === 'seo') {
      const report: SeoReport = analyzeSeo(content)
      job.result = report
    } else {
      job.result = content
    }

    job.status = 'completed'
    job.completedAt = new Date().toISOString()
    await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)
  } catch (error) {
    job.status = 'failed'
    job.error = error instanceof Error ? error.message : 'Unknown error'
    job.completedAt = new Date().toISOString()
    await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)
    throw error
  }
}

/**
 * Gets all jobs sorted by most recent
 */
export async function getJobs(): Promise<CrawlJob[]> {
  const jobs = await cacheGetByPrefix<CrawlJob>(JOB_PREFIX)
  return jobs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Gets a single job by ID
 */
export async function getJob(id: string): Promise<CrawlJob | undefined> {
  const job = await cacheGet<CrawlJob>(`${JOB_PREFIX}${id}`)
  return job ?? undefined
}

/**
 * Clears all jobs (useful for testing)
 */
export async function clearJobs(): Promise<void> {
  const jobs = await cacheGetByPrefix<CrawlJob>(JOB_PREFIX)
  await Promise.all(jobs.map((j) => cacheDel(`${JOB_PREFIX}${j.id}`)))
}
