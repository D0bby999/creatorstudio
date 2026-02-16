import type { ScrapedContent } from '../types/crawler-types'

export function ScrapedContentView({ content }: { content: ScrapedContent }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Basic Info */}
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Page Information</h3>
        <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <span className="min-w-[100px] text-sm font-semibold text-gray-700">Title:</span>
            <span className="flex-1 break-words text-sm text-gray-600">{content.title || 'No title'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="min-w-[100px] text-sm font-semibold text-gray-700">Description:</span>
            <span className="flex-1 break-words text-sm text-gray-600">{content.description || 'No description'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="min-w-[100px] text-sm font-semibold text-gray-700">URL:</span>
            <a href={content.url} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-blue-600 no-underline">
              {content.url}
            </a>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Content Statistics</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-1 text-3xl font-bold text-gray-900">{content.headings.length}</div>
            <div className="text-xs text-gray-600">Headings</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-1 text-3xl font-bold text-gray-900">{content.images.length}</div>
            <div className="text-xs text-gray-600">Images</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-1 text-3xl font-bold text-gray-900">{content.links.length}</div>
            <div className="text-xs text-gray-600">Links</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-4 py-4 text-center">
            <div className="mb-1 text-3xl font-bold text-gray-900">{Math.round(content.text.length / 1000)}k</div>
            <div className="text-xs text-gray-600">Characters</div>
          </div>
        </div>
      </div>

      {/* Headings */}
      {content.headings.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Headings ({content.headings.length})</h3>
          <ul className="m-0 list-disc pl-5">
            {content.headings.slice(0, 10).map((heading, i) => (
              <li key={i} className="mb-2 text-sm text-gray-700">{heading}</li>
            ))}
            {content.headings.length > 10 && (
              <li className="mb-2 text-sm italic text-gray-400">
                ... and {content.headings.length - 10} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Meta Tags */}
      {Object.keys(content.meta).length > 0 && (
        <div className="mb-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Meta Tags ({Object.keys(content.meta).length})</h3>
          <div className="grid auto-fill-minmax-250 gap-3">
            {Object.entries(content.meta).slice(0, 8).map(([key, value]) => (
              <div key={key} className="rounded-md border border-gray-200 bg-white p-3">
                <div className="mb-1 text-xs font-semibold text-gray-600">{key}</div>
                <div className="break-words text-sm text-gray-900">{value}</div>
              </div>
            ))}
            {Object.keys(content.meta).length > 8 && (
              <div className="p-3 text-center text-sm italic text-gray-400">
                ... and {Object.keys(content.meta).length - 8} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text Preview */}
      {content.text && (
        <div className="mb-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Text Content Preview</h3>
          <div className="break-words whitespace-pre-wrap rounded-md border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700">
            {content.text.slice(0, 500)}
            {content.text.length > 500 && '...'}
          </div>
        </div>
      )}

      {/* Images Preview */}
      {content.images.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Images ({content.images.length})</h3>
          <ul className="m-0 list-disc pl-5">
            {content.images.slice(0, 5).map((img, i) => (
              <li key={i} className="mb-2 text-sm text-gray-700">
                <a href={img} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-blue-600 no-underline">
                  {img.length > 80 ? `${img.slice(0, 80)}...` : img}
                </a>
              </li>
            ))}
            {content.images.length > 5 && (
              <li className="mb-2 text-sm italic text-gray-400">
                ... and {content.images.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Links Preview */}
      {content.links.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Links ({content.links.length})</h3>
          <ul className="m-0 list-disc pl-5">
            {content.links.slice(0, 5).map((link, i) => (
              <li key={i} className="mb-2 text-sm text-gray-700">
                <a href={link} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-blue-600 no-underline">
                  {link.length > 80 ? `${link.slice(0, 80)}...` : link}
                </a>
              </li>
            ))}
            {content.links.length > 5 && (
              <li className="mb-2 text-sm italic text-gray-400">
                ... and {content.links.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-2 text-center text-xs text-gray-400">
        Scraped at {new Date(content.scrapedAt).toLocaleString()}
      </div>
    </div>
  )
}
