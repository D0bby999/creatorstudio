import { useState } from 'react'
import { useLoaderData, useFetcher } from 'react-router'
import type { CrawlTemplate } from '@creator-studio/crawler/types/crawler-types'
import { TemplateListPanel } from '@creator-studio/crawler/components/dashboard/template-list-panel'
import { TemplateFormDialog } from '@creator-studio/crawler/components/dashboard/template-form-dialog'
import type { Route } from './+types/crawler.templates'

export async function loader({ request }: Route.LoaderArgs) {
  // TODO: Fetch templates from JobTemplateManager
  const templates: CrawlTemplate[] = []

  return { templates }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create') {
    // TODO: Create template using JobTemplateManager
    return { success: true }
  }

  if (intent === 'delete') {
    const templateId = formData.get('templateId') as string
    // TODO: Delete template
    return { success: true }
  }

  if (intent === 'run') {
    const templateId = formData.get('templateId') as string
    // TODO: Run template (create job from template)
    return { success: true }
  }

  return { error: 'Invalid action' }
}

export default function CrawlerTemplates() {
  const { templates } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const [showDialog, setShowDialog] = useState(false)

  const handleRun = (templateId: string) => {
    fetcher.submit(
      { intent: 'run', templateId },
      { method: 'post' }
    )
  }

  const handleEdit = (templateId: string) => {
    // TODO: Navigate to edit page or open edit dialog
    console.log('Edit template:', templateId)
  }

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      fetcher.submit(
        { intent: 'delete', templateId },
        { method: 'post' }
      )
    }
  }

  const handleCreate = () => {
    setShowDialog(true)
  }

  const handleSave = (template: any) => {
    fetcher.submit(
      { intent: 'create', template: JSON.stringify(template) },
      { method: 'post' }
    )
    setShowDialog(false)
  }

  return (
    <div>
      <TemplateListPanel
        templates={templates}
        onRun={handleRun}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <TemplateFormDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSave={handleSave}
      />
    </div>
  )
}
