interface ConfigState {
  stealth?: boolean
  requestDelay?: { min: number; max: number }
  proxy?: string
}

interface CrawlConfigStepStealthProps {
  config: ConfigState
  onChange: (config: ConfigState) => void
}

export function CrawlConfigStepStealth({ config, onChange }: CrawlConfigStepStealthProps) {
  const delay = config.requestDelay || { min: 1000, max: 3000 }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Stealth & Anti-Bot</h3>
      <p className="text-sm text-gray-600">Configure stealth settings to avoid detection</p>

      {/* Stealth Mode Toggle */}
      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={config.stealth || false}
            onChange={(e) => onChange({ ...config, stealth: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-700">Enable Stealth Mode</div>
            <div className="text-xs text-gray-500">
              Rotate user agents, manage sessions, and use stealth techniques
            </div>
          </div>
        </label>
      </div>

      {/* Request Delay */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Request Delay (ms)</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="delayMin" className="block text-xs text-gray-500">
              Minimum
            </label>
            <input
              type="number"
              id="delayMin"
              min="0"
              step="100"
              value={delay.min}
              onChange={(e) =>
                onChange({
                  ...config,
                  requestDelay: { ...delay, min: parseInt(e.target.value) || 0 }
                })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="delayMax" className="block text-xs text-gray-500">
              Maximum
            </label>
            <input
              type="number"
              id="delayMax"
              min="0"
              step="100"
              value={delay.max}
              onChange={(e) =>
                onChange({
                  ...config,
                  requestDelay: { ...delay, max: parseInt(e.target.value) || 0 }
                })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">Random delay between requests to avoid rate limits</p>
      </div>

      {/* Proxy URL */}
      <div>
        <label htmlFor="proxy" className="block text-sm font-medium text-gray-700">
          Proxy URL (optional)
        </label>
        <input
          type="text"
          id="proxy"
          value={config.proxy || ''}
          onChange={(e) => onChange({ ...config, proxy: e.target.value })}
          placeholder="http://proxy.example.com:8080"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">HTTP/HTTPS proxy for requests</p>
      </div>
    </div>
  )
}
