// Inngest function for executing crawler jobs in background
// Handles URL scraping and SEO analysis asynchronously

import { inngest } from '../inngest-client'
import { smartScrape } from '@creator-studio/crawler/lib/smart-scraper'
import { analyzeSeo } from '@creator-studio/crawler/lib/seo-analyzer'
import { cacheGet, cacheSet } from '@creator-studio/redis/cache'
import type { CrawlJob, ScrapedContent, SeoReport } from '@creator-studio/crawler/types/crawler-types'

const JOB_PREFIX = 'crawler:job:'
const JOB_TTL = 604800 // 7 days

/**
 * Event payload for crawl job execution
 */
interface CrawlJobCreatedEvent {
  data: {
    jobId: string
    url: string
    type: 'url' | 'seo'
  }
}

/**
 * Executes crawl job in background
 * Scrapes URL or analyzes SEO, stores result in Redis
 */
export const crawlJobExecutor = inngest.createFunction(
  {
    id: 'execute-crawl-job',
    name: 'Execute Crawl Job',
    retries: 2,
  },
  { event: 'crawler/job.created' },
  async ({ event, step }) => {
    const { jobId, url, type } = event.data as CrawlJobCreatedEvent['data']

    // Step 1: Load job from Redis
    const job = await step.run('load-job', async () => {
      const result = await cacheGet<CrawlJob>(`${JOB_PREFIX}${jobId}`)

      if (!result) {
        throw new Error(`Job not found: ${jobId}`)
      }

      return result
    })

    // Step 2: Mark job as running
    await step.run('mark-running', async () => {
      job.status = 'running'
      await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)
    })

    // Step 3: Execute scrape
    const content = await step.run('scrape-url', async () => {
      return await smartScrape(url)
    })

    // Step 4: Analyze SEO if needed
    let result: ScrapedContent | SeoReport
    if (type === 'seo') {
      result = await step.run('analyze-seo', async () => {
        return analyzeSeo(content)
      })
    } else {
      result = content
    }

    // Step 5: Store result and mark complete
    await step.run('mark-completed', async () => {
      job.status = 'completed'
      job.result = result
      job.completedAt = new Date().toISOString()
      await cacheSet(`${JOB_PREFIX}${jobId}`, job, JOB_TTL)
    })

    // Step 6: Send completion event (for webhook fanout)
    await step.sendEvent('send-completion-event', {
      name: 'crawler/job.completed',
      data: {
        jobId,
        url,
        type,
        status: 'completed',
      },
    })

    return {
      jobId,
      url,
      type,
      status: 'completed',
      completedAt: job.completedAt,
    }
  }
)
