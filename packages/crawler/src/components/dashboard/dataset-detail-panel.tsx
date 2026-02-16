import { useState } from 'react'
import type { CrawlDataset, DatasetItem } from '../../types/crawler-types'
import { DatasetDiffView } from './dataset-diff-view'

interface DatasetDetailPanelProps {
  dataset: CrawlDataset
  items: DatasetItem[]
  currentPage: number
  totalPages: number
  onExport: (format: 'json' | 'csv' | 'xml') => void
  onCompare?: (otherDatasetId: string) => void
}

export function DatasetDetailPanel({
  dataset,
  items,
  currentPage,
  totalPages,
  onExport,
  onCompare
}: DatasetDetailPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompare, setShowCompare] = useState(false)

  const filteredItems = items.filter((item) =>
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.data.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{dataset.name}</h2>
            {dataset.description && (
              <p className="mt-1 text-sm text-gray-600">{dataset.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onExport('json')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export JSON
            </button>
            <button
              onClick={() => onExport('csv')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => onExport('xml')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export XML
            </button>
            {onCompare && (
              <button
                onClick={() => setShowCompare(!showCompare)}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Compare
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by URL or title..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Scraped At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No items found
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-xs truncate text-sm text-blue-600 hover:text-blue-800"
                    >
                      {item.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.data.title || 'No title'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Compare View (placeholder) */}
      {showCompare && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Compare Datasets</h3>
          <p className="text-sm text-gray-600">
            Dataset comparison feature - select another dataset to compare
          </p>
        </div>
      )}
    </div>
  )
}
