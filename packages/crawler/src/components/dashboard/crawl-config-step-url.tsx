interface ConfigState {
  url: string
  type: 'url' | 'seo' | 'depth' | 'sitemap'
  maxDepth: number
  sameDomainOnly: boolean
}

interface CrawlConfigStepUrlProps {
  config: ConfigState
  onChange: (config: ConfigState) => void
}

export function CrawlConfigStepUrl({ config, onChange }: CrawlConfigStepUrlProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">URL Configuration</h3>

      {/* URL Input */}
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          Target URL
        </label>
        <input
          type="text"
          id="url"
          value={config.url}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://example.com"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Crawl Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Crawl Type</label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="url"
              checked={config.type === 'url'}
              onChange={(e) => onChange({ ...config, type: e.target.value as 'url' })}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Single URL (basic scrape)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="seo"
              checked={config.type === 'seo'}
              onChange={(e) => onChange({ ...config, type: e.target.value as 'seo' })}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">SEO Analysis</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="depth"
              checked={config.type === 'depth'}
              onChange={(e) => onChange({ ...config, type: e.target.value as 'depth' })}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Depth Crawl (recursive)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="sitemap"
              checked={config.type === 'sitemap'}
              onChange={(e) => onChange({ ...config, type: e.target.value as 'sitemap' })}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Sitemap Crawl</span>
          </label>
        </div>
      </div>

      {/* Max Depth (for depth/sitemap) */}
      {(config.type === 'depth' || config.type === 'sitemap') && (
        <div>
          <label htmlFor="maxDepth" className="block text-sm font-medium text-gray-700">
            Max Depth
          </label>
          <input
            type="number"
            id="maxDepth"
            min="1"
            max="10"
            value={config.maxDepth}
            onChange={(e) => onChange({ ...config, maxDepth: parseInt(e.target.value) || 1 })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">How many levels deep to crawl (1-10)</p>
        </div>
      )}

      {/* Same Domain Only */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.sameDomainOnly}
            onChange={(e) => onChange({ ...config, sameDomainOnly: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Same domain only</span>
        </label>
        <p className="ml-6 text-xs text-gray-500">Only crawl URLs from the same domain</p>
      </div>
    </div>
  )
}
