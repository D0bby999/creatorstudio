import { useState } from 'react'
import { useLoaderData, useFetcher } from 'react-router'
import type { CrawlSchedule, CrawlTemplate } from '@creator-studio/crawler/types/crawler-types'
import { ScheduleListPanel } from '@creator-studio/crawler/components/dashboard/schedule-list-panel'
import { ScheduleFormDialog } from '@creator-studio/crawler/components/dashboard/schedule-form-dialog'
import type { Route } from './+types/crawler.schedules'

export async function loader({ request }: Route.LoaderArgs) {
  // TODO: Fetch schedules from JobScheduler and templates from JobTemplateManager
  const schedules: CrawlSchedule[] = []
  const templates: CrawlTemplate[] = []

  return { schedules, templates }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create') {
    // TODO: Create schedule using JobScheduler
    return { success: true }
  }

  if (intent === 'toggle') {
    const scheduleId = formData.get('scheduleId') as string
    const active = formData.get('active') === 'true'
    // TODO: Toggle schedule active status
    return { success: true }
  }

  if (intent === 'delete') {
    const scheduleId = formData.get('scheduleId') as string
    // TODO: Delete schedule
    return { success: true }
  }

  return { error: 'Invalid action' }
}

export default function CrawlerSchedules() {
  const { schedules, templates } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const [showDialog, setShowDialog] = useState(false)

  const handleToggle = (scheduleId: string, active: boolean) => {
    fetcher.submit(
      { intent: 'toggle', scheduleId, active: String(active) },
      { method: 'post' }
    )
  }

  const handleDelete = (scheduleId: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      fetcher.submit(
        { intent: 'delete', scheduleId },
        { method: 'post' }
      )
    }
  }

  const handleCreate = () => {
    setShowDialog(true)
  }

  const handleSave = (schedule: any) => {
    fetcher.submit(
      { intent: 'create', schedule: JSON.stringify(schedule) },
      { method: 'post' }
    )
    setShowDialog(false)
  }

  return (
    <div>
      <ScheduleListPanel
        schedules={schedules}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <ScheduleFormDialog
        isOpen={showDialog}
        templates={templates}
        onClose={() => setShowDialog(false)}
        onSave={handleSave}
      />
    </div>
  )
}
