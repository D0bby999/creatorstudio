import { useState } from 'react'
import type { SocialPlatformConfig } from './social-platform-config.js'

export interface SocialScraperFormData {
  url: string
  maxItems: number
  proxy?: string
}

interface SocialScraperFormProps {
  platform: SocialPlatformConfig
  onSubmit: (config: SocialScraperFormData) => void
  isLoading: boolean
}

export function SocialScraperForm({ platform, onSubmit, isLoading }: SocialScraperFormProps) {
  const [url, setUrl] = useState('')
  const [maxItems, setMaxItems] = useState(platform.defaultMaxItems)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ url, maxItems })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={`${platform.id}-url`} className="block text-sm font-medium text-gray-700">
          {platform.urlLabel}
        </label>
        <input
          id={`${platform.id}-url`}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={platform.urlPlaceholder}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor={`${platform.id}-max`} className="block text-sm font-medium text-gray-700">
          Max {platform.itemLabel}
        </label>
        <input
          id={`${platform.id}-max`}
          type="number"
          min={1}
          max={200}
          value={maxItems}
          onChange={(e) => setMaxItems(parseInt(e.target.value, 10) || platform.defaultMaxItems)}
          className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !url}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Scraping...' : `Scrape ${platform.name}`}
      </button>
    </form>
  )
}
