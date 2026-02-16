import { useState } from 'react'
import type { CrawlTemplate } from '../../types/crawler-types'

interface ScheduleFormDialogProps {
  isOpen: boolean
  templates: CrawlTemplate[]
  onClose: () => void
  onSave: (schedule: { name: string; cron: string; templateId: string }) => void
}

export function ScheduleFormDialog({
  isOpen,
  templates,
  onClose,
  onSave
}: ScheduleFormDialogProps) {
  const [name, setName] = useState('')
  const [cronPreset, setCronPreset] = useState('hourly')
  const [customCron, setCustomCron] = useState('')
  const [templateId, setTemplateId] = useState('')

  if (!isOpen) return null

  const cronPresets = [
    { value: 'hourly', label: 'Every hour', cron: '0 * * * *' },
    { value: 'daily', label: 'Daily at midnight', cron: '0 0 * * *' },
    { value: 'weekly', label: 'Weekly on Sunday', cron: '0 0 * * 0' },
    { value: 'custom', label: 'Custom', cron: '' }
  ]

  const handleSave = () => {
    const selectedPreset = cronPresets.find((p) => p.value === cronPreset)
    const cron = cronPreset === 'custom' ? customCron : selectedPreset?.cron || ''

    onSave({ name, cron, templateId })
    setName('')
    setCronPreset('hourly')
    setCustomCron('')
    setTemplateId('')
  }

  const isValid = name && templateId && (cronPreset !== 'custom' || customCron)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Create Schedule</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="scheduleName" className="block text-sm font-medium text-gray-700">
                Schedule Name
              </label>
              <input
                type="text"
                id="scheduleName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Daily SEO Check"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                Template
              </label>
              <select
                id="template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cronPreset" className="block text-sm font-medium text-gray-700">
                Frequency
              </label>
              <select
                id="cronPreset"
                value={cronPreset}
                onChange={(e) => setCronPreset(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {cronPresets.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {cronPreset === 'custom' && (
              <div>
                <label htmlFor="customCron" className="block text-sm font-medium text-gray-700">
                  Custom Cron Expression
                </label>
                <input
                  type="text"
                  id="customCron"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 0 * * *"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: minute hour day month weekday
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
