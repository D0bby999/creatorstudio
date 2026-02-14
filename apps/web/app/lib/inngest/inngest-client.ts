// Inngest client instance for Creator Studio
// Handles serverless background job queue

import { Inngest } from 'inngest'

/**
 * Inngest client for scheduling and executing background jobs
 * - Social post publishing
 * - Webhook delivery retries
 * - Crawl job execution
 * - Video export orchestration
 */
export const inngest = new Inngest({
  id: 'creator-studio',
  name: 'Creator Studio',
  eventKey: process.env.INNGEST_EVENT_KEY,
})
