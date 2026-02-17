import type { FacebookScrapeResult } from '../../scrapers/facebook/facebook-types.js'
import { FacebookPostCard } from './facebook-post-card.js'

interface FacebookResultsListProps {
  result: FacebookScrapeResult
  onExport: (format: 'json' | 'csv') => void
  onReset: () => void
}

export function FacebookResultsList({ result, onExport, onReset }: FacebookResultsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {result.totalScraped} posts from {result.pageName}
          </h3>
          <p className="text-xs text-gray-500">
            {result.pagesVisited} pages visited in {Math.round((result.completedAt.getTime() - result.startedAt.getTime()) / 1000)}s
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('json')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Export JSON
          </button>
          <button
            onClick={() => onExport('csv')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={onReset}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Scrape Again
          </button>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs font-medium text-yellow-800">Warnings ({result.errors.length}):</p>
          <ul className="mt-1 list-inside list-disc text-xs text-yellow-700">
            {result.errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <div className="max-h-[600px] space-y-3 overflow-y-auto">
        {result.posts.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-8 text-center">
            <p className="text-gray-500">No posts found.</p>
          </div>
        ) : (
          result.posts.map((post) => (
            <FacebookPostCard key={post.postId} post={post} />
          ))
        )}
      </div>
    </div>
  )
}
