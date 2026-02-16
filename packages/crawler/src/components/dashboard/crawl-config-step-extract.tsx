import type { ExtractionConfig } from '../../types/crawler-types'

interface ConfigState {
  extractionConfig?: ExtractionConfig
  customSelectors?: string
}

interface CrawlConfigStepExtractProps {
  config: ConfigState
  onChange: (config: ConfigState) => void
}

export function CrawlConfigStepExtract({ config, onChange }: CrawlConfigStepExtractProps) {
  const extraction = config.extractionConfig || {}

  const updateExtraction = (updates: Partial<ExtractionConfig>) => {
    onChange({
      ...config,
      extractionConfig: { ...extraction, ...updates }
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Data Extraction</h3>
      <p className="text-sm text-gray-600">Select which data extractors to enable</p>

      {/* Extractor Toggles */}
      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={extraction.jsonLd || false}
            onChange={(e) => updateExtraction({ jsonLd: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-700">JSON-LD</div>
            <div className="text-xs text-gray-500">Extract structured data from JSON-LD scripts</div>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={extraction.openGraph || false}
            onChange={(e) => updateExtraction({ openGraph: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-700">OpenGraph</div>
            <div className="text-xs text-gray-500">Extract Open Graph meta tags for social sharing</div>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={extraction.schemaOrg || false}
            onChange={(e) => updateExtraction({ schemaOrg: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-700">Schema.org</div>
            <div className="text-xs text-gray-500">Extract Schema.org microdata markup</div>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={extraction.tables || false}
            onChange={(e) => updateExtraction({ tables: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-700">Tables</div>
            <div className="text-xs text-gray-500">Extract data from HTML tables</div>
          </div>
        </label>
      </div>

      {/* Custom CSS Selectors */}
      <div>
        <label htmlFor="selectors" className="block text-sm font-medium text-gray-700">
          Custom CSS Selectors (optional)
        </label>
        <textarea
          id="selectors"
          rows={3}
          value={config.customSelectors || ''}
          onChange={(e) => onChange({ ...config, customSelectors: e.target.value })}
          placeholder=".article-title, .content p, #main-image"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Comma-separated CSS selectors for custom extraction</p>
      </div>
    </div>
  )
}
