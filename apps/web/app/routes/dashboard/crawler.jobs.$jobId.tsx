import { useLoaderData, useFetcher } from 'react-router'
import type { EnhancedCrawlJob } from '@creator-studio/crawler/types/crawler-types'
import { JobDetailPanel } from '@creator-studio/crawler/components/dashboard/job-detail-panel'
import type { Route } from './+types/crawler.jobs.$jobId'

export async function loader({ params }: Route.LoaderArgs) {
  const jobId = params.jobId

  // TODO: Fetch job by ID from EnhancedJobManager
  // For now, return mock data
  const job: EnhancedCrawlJob = {
    id: jobId,
    url: 'https://example.com',
    type: 'url',
    status: 'completed',
    priority: 'normal',
    retryCount: 0,
    maxRetries: 3,
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return { job }
}

export async function action({ params, request }: Route.ActionArgs) {
  const jobId = params.jobId
  const formData = await request.formData()
  const intent = formData.get('intent')

  // TODO: Perform action on job (pause/resume/cancel/retry)

  return { success: true }
}

export default function CrawlerJobDetail() {
  const { job } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()

  const handleAction = (action: 'pause' | 'resume' | 'cancel' | 'retry') => {
    fetcher.submit(
      { intent: action },
      { method: 'post' }
    )
  }

  return (
    <div>
      <JobDetailPanel job={job} onAction={handleAction} />
    </div>
  )
}
