import type { EnhancedCrawlJob } from '../../types/crawler-types'

interface JobActionsToolbarProps {
  job: EnhancedCrawlJob
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  onRetry: () => void
}

export function JobActionsToolbar({
  job,
  onPause,
  onResume,
  onCancel,
  onRetry
}: JobActionsToolbarProps) {
  return (
    <div className="flex gap-3">
      {job.status === 'running' && (
        <>
          <button
            onClick={onPause}
            className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
          >
            Pause
          </button>
          <button
            onClick={onCancel}
            className="rounded-md border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cancel
          </button>
        </>
      )}

      {job.status === 'paused' && (
        <>
          <button
            onClick={onResume}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Resume
          </button>
          <button
            onClick={onCancel}
            className="rounded-md border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cancel
          </button>
        </>
      )}

      {(job.status === 'failed' || job.status === 'cancelled') && (
        <button
          onClick={onRetry}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Retry
        </button>
      )}
    </div>
  )
}
