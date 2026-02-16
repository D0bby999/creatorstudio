import { Link } from 'react-router'
import type { EnhancedCrawlJob } from '../../types/crawler-types'

interface JobListPanelProps {
  jobs: EnhancedCrawlJob[]
  currentPage: number
  totalPages: number
  onAction: (jobId: string, action: 'pause' | 'resume' | 'cancel' | 'retry') => void
  onNewCrawl: () => void
}

export function JobListPanel({
  jobs,
  currentPage,
  totalPages,
  onAction,
  onNewCrawl
}: JobListPanelProps) {
  const getStatusColor = (status: EnhancedCrawlJob['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      running: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      paused: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || colors.pending
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Crawl Jobs ({jobs.length})
        </h2>
        <button
          onClick={onNewCrawl}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Crawl
        </button>
      </div>

      {/* Jobs Table */}
      {jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No crawl jobs yet. Click "New Crawl" to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/dashboard/crawler/jobs/${job.id}`}
                      className="max-w-xs truncate text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {job.url}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{job.type.toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase ${getStatusColor(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      {job.status === 'running' && (
                        <button
                          onClick={() => onAction(job.id, 'pause')}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          Pause
                        </button>
                      )}
                      {job.status === 'paused' && (
                        <button
                          onClick={() => onAction(job.id, 'resume')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Resume
                        </button>
                      )}
                      {(job.status === 'running' || job.status === 'paused') && (
                        <button
                          onClick={() => onAction(job.id, 'cancel')}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                      {(job.status === 'failed' || job.status === 'cancelled') && (
                        <button
                          onClick={() => onAction(job.id, 'retry')}
                          className="text-green-600 hover:text-green-800"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </div>
  )
}
