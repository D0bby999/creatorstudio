import { useState } from 'react'
import type { ExtractedData } from '../../types/crawler-types'

interface StructuredDataPanelProps {
  data: ExtractedData
}

export function StructuredDataPanel({ data }: StructuredDataPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="space-y-4">
      {/* JSON-LD */}
      {data.jsonLd && data.jsonLd.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => toggleSection('jsonld')}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              JSON-LD ({data.jsonLd.length})
            </h3>
            <span className="text-gray-500">{expandedSection === 'jsonld' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'jsonld' && (
            <div className="border-t border-gray-200 px-4 py-3">
              <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">
                {JSON.stringify(data.jsonLd, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* OpenGraph */}
      {data.openGraph && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => toggleSection('og')}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">OpenGraph</h3>
            <span className="text-gray-500">{expandedSection === 'og' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'og' && (
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                {data.openGraph.image && (
                  <img
                    src={data.openGraph.image}
                    alt={data.openGraph.title || 'OG Image'}
                    className="mb-3 h-32 w-full rounded object-cover"
                  />
                )}
                <h4 className="text-lg font-semibold text-gray-900">
                  {data.openGraph.title || 'No title'}
                </h4>
                <p className="mt-2 text-sm text-gray-600">
                  {data.openGraph.description || 'No description'}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  {data.openGraph.siteName && <div>Site: {data.openGraph.siteName}</div>}
                  {data.openGraph.type && <div>Type: {data.openGraph.type}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schema.org */}
      {data.schemaOrg && data.schemaOrg.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => toggleSection('schema')}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Schema.org ({data.schemaOrg.length})
            </h3>
            <span className="text-gray-500">{expandedSection === 'schema' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'schema' && (
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="space-y-3">
                {data.schemaOrg.map((schema, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 text-sm font-semibold text-gray-900">
                      {schema.type}
                    </div>
                    <pre className="overflow-auto text-xs">
                      {JSON.stringify(schema.properties, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tables */}
      {data.tables && data.tables.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => toggleSection('tables')}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Tables ({data.tables.length})
            </h3>
            <span className="text-gray-500">{expandedSection === 'tables' ? '▼' : '▶'}</span>
          </button>
          {expandedSection === 'tables' && (
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="space-y-4">
                {data.tables.map((table, idx) => (
                  <div key={idx} className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {table.headers.map((header, hIdx) => (
                            <th
                              key={hIdx}
                              className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {table.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 text-sm text-gray-900">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
