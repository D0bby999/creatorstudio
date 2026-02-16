import { useState } from 'react'
import { ScrapedContentView } from '../scraped-content-view'
import { SeoReportView } from '../seo-report-view'
import type { ScrapedContent, SeoReport } from '../../types/crawler-types'

interface CrawlResultsViewerProps {
  result: unknown
  type: string
}

export function CrawlResultsViewer({ result, type }: CrawlResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<'raw' | 'structured' | 'seo'>('structured')

  const tabs = [
    { id: 'structured' as const, label: 'Structured Data' },
    { id: 'raw' as const, label: 'Raw Data' },
    ...(type === 'seo' ? [{ id: 'seo' as const, label: 'SEO Report' }] : [])
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'structured' && (
          <div>
            {type === 'seo' ? (
              <SeoReportView report={result as SeoReport} />
            ) : (
              <ScrapedContentView content={result as ScrapedContent} />
            )}
          </div>
        )}

        {activeTab === 'raw' && (
          <pre className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}

        {activeTab === 'seo' && type === 'seo' && (
          <SeoReportView report={result as SeoReport} />
        )}
      </div>
    </div>
  )
}
