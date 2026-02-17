import { useState } from 'react'
import type { FacebookScrapeResult } from '../../scrapers/facebook/facebook-types.js'
import { FacebookScraperForm, type FacebookScraperFormData } from './facebook-scraper-form.js'
import { FacebookResultsList } from './facebook-results-list.js'

interface FacebookScraperPanelProps {
  onScrape: (config: FacebookScraperFormData) => Promise<FacebookScrapeResult>
}

export function FacebookScraperPanel({ onScrape }: FacebookScraperPanelProps) {
  const [result, setResult] = useState<FacebookScrapeResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (config: FacebookScraperFormData) => {
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

    let content: string
    let mimeType: string
    let filename: string

    if (format === 'json') {
      content = JSON.stringify(result.posts, null, 2)
      mimeType = 'application/json'
      filename = `facebook-${result.pageName}-${Date.now()}.json`
    } else {
      const headers = ['postId', 'text', 'author', 'timestampRaw', 'reactions', 'comments', 'shares', 'permalink']
      const rows = result.posts.map((p) =>
        headers.map((h) => {
          const val = p[h as keyof typeof p]
          const str = String(val ?? '')
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(',')
      )
      content = [headers.join(','), ...rows].join('\n')
      mimeType = 'text/csv'
      filename = `facebook-${result.pageName}-${Date.now()}.csv`
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
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
        <h2 className="text-xl font-semibold text-gray-900">Facebook Page Scraper</h2>
        <p className="mt-1 text-sm text-gray-600">
          Extract latest posts from any public Facebook page.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!result ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <FacebookScraperForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      ) : (
        <FacebookResultsList result={result} onExport={handleExport} onReset={handleReset} />
      )}
    </div>
  )
}
