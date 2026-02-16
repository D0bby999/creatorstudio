interface ConfigState {
  maxPages?: number
  maxDurationMinutes?: number
  maxMegabytes?: number
  priority: 'urgent' | 'high' | 'normal' | 'low'
}

interface CrawlConfigStepLimitsProps {
  config: ConfigState
  onChange: (config: ConfigState) => void
}

export function CrawlConfigStepLimits({ config, onChange }: CrawlConfigStepLimitsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Resource Limits</h3>
      <p className="text-sm text-gray-600">Set limits to control resource usage</p>

      {/* Max Pages */}
      <div>
        <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700">
          Max Pages
        </label>
        <input
          type="number"
          id="maxPages"
          min="1"
          value={config.maxPages || 100}
          onChange={(e) => onChange({ ...config, maxPages: parseInt(e.target.value) || 100 })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Maximum number of pages to crawl</p>
      </div>

      {/* Max Duration */}
      <div>
        <label htmlFor="maxDuration" className="block text-sm font-medium text-gray-700">
          Max Duration (minutes)
        </label>
        <input
          type="number"
          id="maxDuration"
          min="1"
          value={config.maxDurationMinutes || 60}
          onChange={(e) =>
            onChange({ ...config, maxDurationMinutes: parseInt(e.target.value) || 60 })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Maximum crawl duration in minutes</p>
      </div>

      {/* Max Bytes */}
      <div>
        <label htmlFor="maxBytes" className="block text-sm font-medium text-gray-700">
          Max Data (MB)
        </label>
        <input
          type="number"
          id="maxBytes"
          min="1"
          value={config.maxMegabytes || 100}
          onChange={(e) => onChange({ ...config, maxMegabytes: parseInt(e.target.value) || 100 })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Maximum data to download in megabytes</p>
      </div>

      {/* Priority */}
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          id="priority"
          value={config.priority}
          onChange={(e) =>
            onChange({ ...config, priority: e.target.value as ConfigState['priority'] })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">Job execution priority in the queue</p>
      </div>
    </div>
  )
}
