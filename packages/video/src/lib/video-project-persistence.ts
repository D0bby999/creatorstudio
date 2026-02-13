import { createProject, findProjectById, updateProject } from '@creator-studio/db'
import type { VideoProject } from '../types/video-types'

export async function saveVideoProject(project: VideoProject, projectId: string): Promise<void> {
  await updateProject(projectId, { data: project })
}

export async function loadVideoProject(projectId: string): Promise<VideoProject | null> {
  const project = await findProjectById(projectId)
  return project?.data as VideoProject | null ?? null
}

export async function createVideoProjectRecord(name: string, userId: string): Promise<string> {
  const project = await createProject({ name, type: 'video', userId })
  return project.id
}
