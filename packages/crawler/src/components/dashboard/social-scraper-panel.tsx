import { useState } from 'react'
import { SocialScraperForm, type SocialScraperFormData } from './social-scraper-form.js'
import { SocialScraperResults } from './social-scraper-results.js'
import type { SocialPlatformConfig } from './social-platform-config.js'

interface SocialScraperPanelProps {
  platform: SocialPlatformConfig
  onScrape: (config: SocialScraperFormData) => Promise<unknown>
}

export function SocialScraperPanel({ platform, onScrape }: SocialScraperPanelProps) {
  const [result, setResult] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (config: SocialScraperFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const scrapeResult = await onScrape(config)
      setResult(scrapeResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scraping failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = (format: 'json' | 'csv') => {
    if (!result) return
    const items = platform.getItems(result)
    let content: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(items, null, 2)
      mimeType = 'application/json'
    } else {
      const headers = platform.csvHeaders
      const rows = items.map((item: Record<string, unknown>) =>
        headers.map((h) => {
          const val = String(item[h] ?? '')
          return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
        }).join(',')
      )
      content = [headers.join(','), ...rows].join('\n')
      mimeType = 'text/csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${platform.id}-${Date.now()}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{platform.title}</h2>
        <p className="mt-1 text-sm text-gray-600">{platform.description}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!result ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <SocialScraperForm platform={platform} onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      ) : (
        <SocialScraperResults
          platform={platform}
          result={result}
          onExport={handleExport}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
