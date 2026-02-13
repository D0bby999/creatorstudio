import { createProject, findProjectById, updateProject } from '@creator-studio/db'
import type { Editor } from 'tldraw'

/** Save canvas snapshot to database project */
export async function saveCanvasToProject(editor: Editor, projectId: string): Promise<void> {
  const snapshot = editor.store.getStoreSnapshot()
  await updateProject(projectId, { data: snapshot })
}

/** Load canvas snapshot from database project */
export async function loadCanvasFromProject(editor: Editor, projectId: string): Promise<void> {
  const project = await findProjectById(projectId)
  if (project?.data) {
    editor.store.loadSnapshot(project.data as any)
  }
}

/** Create new canvas project in database */
export async function createCanvasProject(name: string, userId: string): Promise<string> {
  const project = await createProject({ name, type: 'canvas', userId })
  return project.id
}
