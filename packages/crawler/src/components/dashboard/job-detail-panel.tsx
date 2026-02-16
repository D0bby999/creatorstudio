import type { EnhancedCrawlJob } from '../../types/crawler-types'
import { JobProgressDisplay } from './job-progress-display'
import { JobActionsToolbar } from './job-actions-toolbar'
import { CrawlResultsViewer } from './crawl-results-viewer'

interface JobDetailPanelProps {
  job: EnhancedCrawlJob
  onAction: (action: 'pause' | 'resume' | 'cancel' | 'retry') => void
}

export function JobDetailPanel({ job, onAction }: JobDetailPanelProps) {
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      normal: 'text-blue-600',
      low: 'text-gray-600'
    }
    return colors[priority as keyof typeof colors] || colors.normal
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{job.url}</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="text-gray-600">
                Type: <span className="font-medium">{job.type.toUpperCase()}</span>
              </span>
              <span className="text-gray-600">
                Status: <span className="font-medium">{job.status}</span>
              </span>
              <span className={`font-medium ${getPriorityColor(job.priority)}`}>
                Priority: {job.priority.toUpperCase()}
              </span>
            </div>
          </div>
          <JobActionsToolbar
            job={job}
            onPause={() => onAction('pause')}
            onResume={() => onAction('resume')}
            onCancel={() => onAction('cancel')}
            onRetry={() => onAction('retry')}
          />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-gray-500">Created</div>
            <div className="font-medium text-gray-900">
              {new Date(job.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Started</div>
            <div className="font-medium text-gray-900">
              {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Completed</div>
            <div className="font-medium text-gray-900">
              {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'In progress'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Retries</div>
            <div className="font-medium text-gray-900">
              {job.retryCount} / {job.maxRetries}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {job.status === 'running' && job.progress && (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-4">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Progress</h3>
          <JobProgressDisplay progress={job.progress} />
        </div>
      )}

      {/* Error Section */}
      {job.status === 'failed' && job.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4">
          <h3 className="mb-2 text-lg font-semibold text-red-900">Error</h3>
          <p className="text-sm text-red-800">{job.error}</p>
        </div>
      )}

      {/* Results Section */}
      {job.status === 'completed' && job.result && (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-4">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Results</h3>
          <CrawlResultsViewer result={job.result} type={job.type} />
        </div>
      )}
    </div>
  )
}
