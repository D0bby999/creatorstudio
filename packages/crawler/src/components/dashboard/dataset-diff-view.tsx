import type { DatasetDiff } from '../../types/crawler-types'

interface DatasetDiffViewProps {
  diff: DatasetDiff
}

export function DatasetDiffView({ diff }: DatasetDiffViewProps) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-900">{diff.added.length}</div>
          <div className="text-sm text-green-700">Added</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <div className="text-2xl font-bold text-red-900">{diff.removed.length}</div>
          <div className="text-sm text-red-700">Removed</div>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-900">{diff.changed.length}</div>
          <div className="text-sm text-yellow-700">Changed</div>
        </div>
      </div>

      {/* Added URLs */}
      {diff.added.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Added URLs</h3>
          <ul className="space-y-2">
            {diff.added.map((url, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-green-600">+</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-blue-600 hover:text-blue-800"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Removed URLs */}
      {diff.removed.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Removed URLs</h3>
          <ul className="space-y-2">
            {diff.removed.map((url, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-red-600">-</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-blue-600 hover:text-blue-800"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Changed URLs */}
      {diff.changed.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Changed URLs</h3>
          <ul className="space-y-3">
            {diff.changed.map((change, idx) => (
              <li key={idx} className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-600">~</span>
                  <a
                    href={change.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-medium text-blue-600 hover:text-blue-800"
                  >
                    {change.url}
                  </a>
                </div>
                <div className="ml-5 mt-1 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Old:</span> {change.oldHash.slice(0, 8)}...
                  </div>
                  <div>
                    <span className="font-medium">New:</span> {change.newHash.slice(0, 8)}...
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white py-8 text-center">
          <p className="text-gray-500">No differences found between datasets</p>
        </div>
      )}
    </div>
  )
}
