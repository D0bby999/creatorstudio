import type { SocialPlatformConfig } from './social-platform-config.js'

interface SocialScraperResultsProps {
  platform: SocialPlatformConfig
  result: unknown
  onExport: (format: 'json' | 'csv') => void
  onReset: () => void
}

export function SocialScraperResults({ platform, result, onExport, onReset }: SocialScraperResultsProps) {
  const items = platform.getItems(result)
  const errors = platform.getErrors(result)
  const source = platform.getSource(result)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {items.length} {platform.itemLabel} scraped
          </h3>
          <span className="text-xs text-gray-500">Source: {source}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('json')}
            className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
          >
            Export JSON
          </button>
          <button
            onClick={() => onExport('csv')}
            className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={onReset}
            className="rounded border border-gray-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Reset
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs font-medium text-yellow-800">Warnings ({errors.length})</p>
          <ul className="mt-1 list-inside list-disc text-xs text-yellow-700">
            {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item: Record<string, unknown>, i: number) => {
          const CardComponent = platform.CardComponent
          return <CardComponent key={String(item.id ?? i)} item={item} />
        })}
      </div>
    </div>
  )
}
