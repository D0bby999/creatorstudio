import { useState } from 'react'
import type { CrawlerEngineConfig, ExtractionConfig } from '../../types/crawler-types'
import { CrawlConfigWizard } from './crawl-config-wizard'

interface TemplateFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: {
    name: string
    description?: string
    config: Partial<CrawlerEngineConfig>
    isPublic: boolean
  }) => void
}

export function TemplateFormDialog({ isOpen, onClose, onSave }: TemplateFormDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  if (!isOpen) return null

  const handleWizardSubmit = (config: Partial<CrawlerEngineConfig> & { url: string; extractionConfig?: ExtractionConfig }) => {
    const { url, extractionConfig, ...engineConfig } = config
    onSave({
      name,
      description,
      config: engineConfig,
      isPublic
    })
    setName('')
    setDescription('')
    setIsPublic(false)
    setShowWizard(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Create Template</h2>

          {!showWizard ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">
                  Template Name
                </label>
                <input
                  type="text"
                  id="templateName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Template"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="templateDesc" className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  id="templateDesc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Template description..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Make template public</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowWizard(true)}
                  disabled={!name}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <CrawlConfigWizard
              onSubmit={handleWizardSubmit}
              onCancel={() => setShowWizard(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
