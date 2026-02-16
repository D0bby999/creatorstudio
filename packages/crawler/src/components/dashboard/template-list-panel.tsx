import type { CrawlTemplate } from '../../types/crawler-types'

interface TemplateListPanelProps {
  templates: CrawlTemplate[]
  onRun: (templateId: string) => void
  onEdit: (templateId: string) => void
  onDelete: (templateId: string) => void
  onCreate: () => void
}

export function TemplateListPanel({
  templates,
  onRun,
  onEdit,
  onDelete,
  onCreate
}: TemplateListPanelProps) {
  const getExtractorBadges = (config: CrawlTemplate['config']) => {
    const badges: string[] = []
    if (config.stealth) badges.push('Stealth')
    if (config.maxDepth && config.maxDepth > 1) badges.push(`Depth:${config.maxDepth}`)
    if (config.sameDomainOnly) badges.push('Same Domain')
    return badges
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Templates ({templates.length})
        </h2>
        <button
          onClick={onCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No templates yet. Create one to save crawl configurations.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
            >
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                {template.description && (
                  <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                )}
              </div>

              {/* Extractor Badges */}
              <div className="mb-4 flex flex-wrap gap-2">
                {getExtractorBadges(template.config).map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                  >
                    {badge}
                  </span>
                ))}
                {template.isPublic && (
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Public
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onRun(template.id)}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Run
                </button>
                <button
                  onClick={() => onEdit(template.id)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(template.id)}
                  className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Created {new Date(template.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
