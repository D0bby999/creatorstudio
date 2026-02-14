import type { Route } from './+types/api.crawler'
import { createJob, getJobs } from '@creator-studio/crawler/lib/crawl-job-manager'
import { requireSession } from '~/lib/auth-server'
import { logger } from '~/lib/logger'

/**
 * POST handler: creates a new crawl job
 */
export async function action({ request }: Route.ActionArgs) {
  await requireSession(request)
  try {
    const body = await request.json()
    const { url, type } = body

    if (!url || typeof url !== 'string') {
      return Response.json(
        { error: 'Missing or invalid URL' },
        { status: 400 }
      )
    }

    if (!type || !['url', 'seo'].includes(type)) {
      return Response.json(
        { error: 'Invalid job type. Must be "url" or "seo"' },
        { status: 400 }
      )
    }

    const job = await createJob(url, type)

    return Response.json({ job }, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Crawler API error')
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET handler: returns list of recent jobs
 */
export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request)
  try {
    const jobs = await getJobs()
    return Response.json({ jobs })
  } catch (error) {
    logger.error({ err: error }, 'Crawler API error')
    return Response.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
