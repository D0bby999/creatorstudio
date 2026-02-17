import { useState } from 'react'
import type { FacebookScraperStrategy } from '../../scrapers/facebook/facebook-types.js'

export interface FacebookScraperFormData {
  url: string
  cookies?: { c_user: string; xs: string }
  maxPosts: number
  strategy: FacebookScraperStrategy
}

interface FacebookScraperFormProps {
  onSubmit: (config: FacebookScraperFormData) => void
  isLoading: boolean
}

export function FacebookScraperForm({ onSubmit, isLoading }: FacebookScraperFormProps) {
  const [url, setUrl] = useState('')
  const [useCookies, setUseCookies] = useState(false)
  const [cUser, setCUser] = useState('')
  const [xs, setXs] = useState('')
  const [maxPosts, setMaxPosts] = useState(50)
  const [strategy, setStrategy] = useState<FacebookScraperStrategy>('auto')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      url,
      cookies: useCookies && cUser && xs ? { c_user: cUser, xs } : undefined,
      maxPosts,
      strategy,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fb-url" className="block text-sm font-medium text-gray-700">
          Facebook Page URL
        </label>
        <input
          id="fb-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://facebook.com/PageName"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label htmlFor="max-posts" className="block text-sm font-medium text-gray-700">
            Max Posts
          </label>
          <input
            id="max-posts"
            type="number"
            min={1}
            max={500}
            value={maxPosts}
            onChange={(e) => setMaxPosts(parseInt(e.target.value, 10) || 50)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="strategy" className="block text-sm font-medium text-gray-700">
            Strategy
          </label>
          <select
            id="strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as FacebookScraperStrategy)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="auto">Auto</option>
            <option value="mbasic">mbasic (recommended)</option>
            <option value="graphql">GraphQL (experimental)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useCookies}
            onChange={(e) => setUseCookies(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="font-medium text-gray-700">Use session cookies (for private pages)</span>
        </label>
      </div>

      {useCookies && (
        <div className="flex gap-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <div className="flex-1">
            <label htmlFor="c-user" className="block text-xs font-medium text-gray-600">c_user</label>
            <input
              id="c-user"
              type="password"
              value={cUser}
              onChange={(e) => setCUser(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="xs-token" className="block text-xs font-medium text-gray-600">xs</label>
            <input
              id="xs-token"
              type="password"
              value={xs}
              onChange={(e) => setXs(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !url}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Scraping...' : 'Start Scraping'}
      </button>
    </form>
  )
}
