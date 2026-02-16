import type { SeoReport } from '../types/crawler-types'

export function SeoReportView({ report }: { report: SeoReport }) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 50) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Score Overview */}
      <div className="flex justify-center p-5">
        <div className={`flex h-32 w-32 flex-col items-center justify-center rounded-full text-white ${getScoreColor(report.score)}`}>
          <div className="text-5xl font-bold leading-none">{report.score}</div>
          <div className="mt-2 text-sm font-semibold">{getScoreLabel(report.score)}</div>
        </div>
      </div>

      {/* Title Analysis */}
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Title</h3>
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <div className="mb-2 text-sm break-words">{report.title.value || 'No title'}</div>
          <div className="flex gap-3 text-xs">
            <span className={report.title.optimal ? 'font-semibold text-green-600' : 'font-semibold text-yellow-600'}>
              {report.title.length} characters
            </span>
            <span className="text-gray-600">Optimal: 30-60 characters</span>
          </div>
        </div>
      </div>

      {/* Description Analysis */}
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Meta Description</h3>
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <div className="mb-2 text-sm break-words">{report.description.value || 'No description'}</div>
          <div className="flex gap-3 text-xs">
            <span className={report.description.optimal ? 'font-semibold text-green-600' : 'font-semibold text-yellow-600'}>
              {report.description.length} characters
            </span>
            <span className="text-gray-600">Optimal: 120-160 characters</span>
          </div>
        </div>
      </div>

      {/* Headings Structure */}
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Heading Structure</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-2 text-xs text-gray-600">H1</div>
            <div className={`text-2xl font-bold ${report.headings.hasH1 ? 'text-green-600' : 'text-red-600'}`}>
              {report.headings.h1Count}
            </div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-2 text-xs text-gray-600">H2</div>
            <div className="text-2xl font-bold text-gray-900">{report.headings.h2Count}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-2 text-xs text-gray-600">H3</div>
            <div className="text-2xl font-bold text-gray-900">{report.headings.h3Count}</div>
          </div>
        </div>
        {!report.headings.hasH1 && (
          <div className="mt-3 rounded bg-yellow-100 px-2 py-2 text-xs text-yellow-900">Missing H1 heading (required for SEO)</div>
        )}
      </div>

      {/* Images Analysis */}
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Images</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-2 text-xs text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{report.images.total}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-2 text-xs text-gray-600">With Alt Text</div>
            <div className="text-2xl font-bold text-green-600">{report.images.withAlt}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-2 text-xs text-gray-600">Missing Alt</div>
            <div className="text-2xl font-bold text-red-600">{report.images.missingAlt}</div>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {report.keywords.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Top Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {report.keywords.slice(0, 10).map((kw, i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm">
                <span className="font-medium text-blue-900">{kw.word}</span>
                <span className="text-xs font-semibold text-gray-600">{kw.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {report.issues.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Issues Found ({report.issues.length})</h3>
          <ul className="m-0 list-disc pl-5">
            {report.issues.map((issue, i) => (
              <li key={i} className="mb-2 text-sm text-red-700">{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 text-center text-xs text-gray-400">
        Analyzed at {new Date(report.analyzedAt).toLocaleString()}
      </div>
    </div>
  )
}
