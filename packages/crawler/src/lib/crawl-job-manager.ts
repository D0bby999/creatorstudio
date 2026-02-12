import type { CrawlJob, ScrapedContent, SeoReport } from '../types/crawler-types'
import { scrapeUrl } from './url-scraper'
import { analyzeSeo } from './seo-analyzer'

// In-memory job storage (simple MVP - can be replaced with BullMQ later)
const jobs = new Map<string, CrawlJob>()

/**
 * Generates unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
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
    createdAt: new Date().toISOString()
  }

  jobs.set(jobId, job)

  // Execute job asynchronously
  executeJob(jobId).catch(error => {
    const failedJob = jobs.get(jobId)
    if (failedJob) {
      failedJob.status = 'failed'
      failedJob.error = error instanceof Error ? error.message : 'Unknown error'
      failedJob.completedAt = new Date().toISOString()
    }
  })

  return job
}

/**
 * Executes a crawl job
 */
async function executeJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId)
  if (!job) return

  job.status = 'running'

  try {
    // Scrape URL
    const content: ScrapedContent = await scrapeUrl(job.url)

    // If SEO analysis requested, analyze the content
    if (job.type === 'seo') {
      const report: SeoReport = analyzeSeo(content)
      job.result = report
    } else {
      job.result = content
    }

    job.status = 'completed'
    job.completedAt = new Date().toISOString()
  } catch (error) {
    job.status = 'failed'
    job.error = error instanceof Error ? error.message : 'Unknown error'
    job.completedAt = new Date().toISOString()
    throw error
  }
}

/**
 * Gets all jobs
 */
export function getJobs(): CrawlJob[] {
  return Array.from(jobs.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Gets a single job by ID
 */
export function getJob(id: string): CrawlJob | undefined {
  return jobs.get(id)
}

/**
 * Clears all jobs (useful for testing)
 */
export function clearJobs(): void {
  jobs.clear()
}
