import type { JobProgress } from '../../types/crawler-types'

interface JobProgressDisplayProps {
  progress: JobProgress
}

export function JobProgressDisplay({ progress }: JobProgressDisplayProps) {
  const percentage =
    progress.pagesTotal > 0
      ? Math.round((progress.pagesCrawled / progress.pagesTotal) * 100)
      : 0

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Progress</span>
          <span className="text-gray-600">{percentage}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-2xl font-bold text-gray-900">{progress.pagesCrawled}</div>
          <div className="text-xs text-gray-500">Pages Crawled</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(progress.elapsedMs)}
          </div>
          <div className="text-xs text-gray-500">Elapsed Time</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(progress.estimatedRemainingMs)}
          </div>
          <div className="text-xs text-gray-500">ETA</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-2xl font-bold text-gray-900">
            {formatBytes(progress.bytesDownloaded)}
          </div>
          <div className="text-xs text-gray-500">Downloaded</div>
        </div>
      </div>

      {/* Current URL */}
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div className="mb-1 text-xs font-medium text-gray-500">Current URL</div>
        <div className="truncate text-sm text-gray-900">{progress.currentUrl}</div>
      </div>
    </div>
  )
}
