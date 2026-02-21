import { useState } from 'react'

interface ErrorSnapshotEntry {
  signature: string
  count: number
  snapshot?: {
    screenshotKey?: string
    htmlKey?: string
    consoleErrors: string[]
    url: string
    timestamp: number
  }
}

interface ErrorSnapshotViewerProps {
  errors: ErrorSnapshotEntry[]
}

export function ErrorSnapshotViewer({ errors }: ErrorSnapshotViewerProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  if (errors.length === 0) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm text-green-700">No errors captured during this crawl.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">Error Snapshots ({errors.length})</h3>
      {errors.map((entry, idx) => (
        <div key={idx} className="rounded-lg border border-red-200 bg-white">
          <button
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex-1 truncate">
              <span className="text-sm font-medium text-red-700">{entry.signature.slice(0, 80)}</span>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                {entry.count}x
              </span>
              <span className="text-gray-400">{expandedIdx === idx ? '▲' : '▼'}</span>
            </div>
          </button>

          {expandedIdx === idx && entry.snapshot && (
            <div className="border-t border-red-100 px-4 py-3 text-sm">
              <div className="mb-2">
                <span className="font-medium text-gray-600">URL: </span>
                <span className="text-gray-800">{entry.snapshot.url}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium text-gray-600">Time: </span>
                <span className="text-gray-800">{new Date(entry.snapshot.timestamp).toLocaleString()}</span>
              </div>

              {entry.snapshot.consoleErrors.length > 0 && (
                <div className="mb-2">
                  <span className="font-medium text-gray-600">Console errors:</span>
                  <ul className="mt-1 list-inside list-disc text-xs text-gray-700">
                    {entry.snapshot.consoleErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                {entry.snapshot.screenshotKey && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    Screenshot: {entry.snapshot.screenshotKey}
                  </span>
                )}
                {entry.snapshot.htmlKey && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    HTML: {entry.snapshot.htmlKey}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
