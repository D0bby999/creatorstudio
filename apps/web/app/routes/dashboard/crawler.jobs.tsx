import { useState } from 'react'
import { useLoaderData, useFetcher } from 'react-router'
import type { EnhancedCrawlJob } from '@creator-studio/crawler/types/crawler-types'
import { JobListPanel } from '@creator-studio/crawler/components/dashboard/job-list-panel'
import { CrawlConfigWizard } from '@creator-studio/crawler/components/dashboard/crawl-config-wizard'
import type { Route } from './+types/crawler.jobs'

export async function loader({ request }: Route.LoaderArgs) {
  // TODO: Fetch jobs from EnhancedJobManager
  const jobs: EnhancedCrawlJob[] = []

  return {
    jobs,
    currentPage: 1,
    totalPages: 1
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create') {
    // TODO: Create job using EnhancedJobManager
    return { success: true }
  }

  if (intent === 'pause' || intent === 'resume' || intent === 'cancel' || intent === 'retry') {
    const jobId = formData.get('jobId') as string
    // TODO: Perform action on job
    return { success: true }
  }

  return { error: 'Invalid action' }
}

export default function CrawlerJobs() {
  const { jobs, currentPage, totalPages } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const [showWizard, setShowWizard] = useState(false)

  const handleAction = (jobId: string, action: 'pause' | 'resume' | 'cancel' | 'retry') => {
    fetcher.submit(
      { intent: action, jobId },
      { method: 'post' }
    )
  }

  const handleNewCrawl = () => {
    setShowWizard(true)
  }

  const handleWizardSubmit = (config: any) => {
    fetcher.submit(
      { intent: 'create', config: JSON.stringify(config) },
      { method: 'post' }
    )
    setShowWizard(false)
  }

  return (
    <div>
      <JobListPanel
        jobs={jobs}
        currentPage={currentPage}
        totalPages={totalPages}
        onAction={handleAction}
        onNewCrawl={handleNewCrawl}
      />

      {showWizard && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowWizard(false)} />
            <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">New Crawl Job</h2>
              <CrawlConfigWizard
                onSubmit={handleWizardSubmit}
                onCancel={() => setShowWizard(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
