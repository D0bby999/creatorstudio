import { Link } from 'react-router'
import type { CrawlDataset } from '../../types/crawler-types'

interface DatasetListPanelProps {
  datasets: CrawlDataset[]
  onExport: (datasetId: string, format: 'json' | 'csv' | 'xml') => void
}

export function DatasetListPanel({ datasets, onExport }: DatasetListPanelProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Datasets ({datasets.length})
        </h2>
      </div>

      {/* Datasets Grid */}
      {datasets.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No datasets yet. Completed crawls will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
            >
              <Link to={`/dashboard/crawler/datasets/${dataset.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                  {dataset.name}
                </h3>
              </Link>
              {dataset.description && (
                <p className="mt-1 text-sm text-gray-600">{dataset.description}</p>
              )}

              {/* Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-gray-500">Items</div>
                  <div className="font-semibold text-gray-900">{dataset.itemCount}</div>
                </div>
                <div>
                  <div className="text-gray-500">Size</div>
                  <div className="font-semibold text-gray-900">
                    {formatBytes(dataset.totalBytes)}
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onExport(dataset.id, 'json')}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  JSON
                </button>
                <button
                  onClick={() => onExport(dataset.id, 'csv')}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  CSV
                </button>
                <button
                  onClick={() => onExport(dataset.id, 'xml')}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  XML
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Created {new Date(dataset.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
