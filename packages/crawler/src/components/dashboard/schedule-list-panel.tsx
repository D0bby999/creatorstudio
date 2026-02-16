import type { CrawlSchedule } from '../../types/crawler-types'

interface ScheduleListPanelProps {
  schedules: CrawlSchedule[]
  onToggle: (scheduleId: string, active: boolean) => void
  onDelete: (scheduleId: string) => void
  onCreate: () => void
}

export function ScheduleListPanel({
  schedules,
  onToggle,
  onDelete,
  onCreate
}: ScheduleListPanelProps) {
  const getCronDescription = (cron: string) => {
    // Simple cron parser for common patterns
    if (cron === '0 * * * *') return 'Every hour'
    if (cron === '0 0 * * *') return 'Daily at midnight'
    if (cron === '0 0 * * 0') return 'Weekly on Sunday'
    if (cron === '0 0 1 * *') return 'Monthly on 1st'
    return cron
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Schedules ({schedules.length})
        </h2>
        <button
          onClick={onCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Schedule
        </button>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No schedules yet. Create one to automate crawls.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Schedule:</span>{' '}
                      {getCronDescription(schedule.cron)}
                    </div>
                    <div>
                      <span className="font-medium">Template:</span> {schedule.templateId}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    {schedule.lastRunAt && (
                      <div>Last run: {new Date(schedule.lastRunAt).toLocaleString()}</div>
                    )}
                    {schedule.nextRunAt && (
                      <div>Next run: {new Date(schedule.nextRunAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Active Toggle */}
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={schedule.isActive}
                      onChange={(e) => onToggle(schedule.id, e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300" />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(schedule.id)}
                    className="rounded-md border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
