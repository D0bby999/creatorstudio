/**
 * Client-side helpers for canvas AI video generation
 * Handles job submission, polling, and canvas insertion
 */

import type { Editor } from 'tldraw'
import type { AiActionResult } from './canvas-ai-actions'

export interface VideoGenQuota {
  used: number
  limit: number
}

export interface VideoGenResponse {
  jobId: string
  quota: VideoGenQuota
}

export type VideoJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface VideoStatusResponse {
  status: VideoJobStatus
  videoUrl?: string
  error?: string
}

export async function startVideoGeneration(
  endpoint: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16' | '1:1',
): Promise<{ success: true; data: VideoGenResponse } | { success: false; error: string }> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio }),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error ?? `Request failed (${res.status})` }
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Network error' }
  }
}

const POLL_INTERVAL_MS = 5_000
const MAX_POLL_DURATION_MS = 180_000

export async function pollVideoStatus(
  statusEndpoint: string,
  jobId: string,
  onProgress?: (status: VideoJobStatus) => void,
): Promise<VideoStatusResponse> {
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
    try {
      const res = await fetch(`${statusEndpoint}?jobId=${encodeURIComponent(jobId)}`)
      const data: VideoStatusResponse = await res.json()

      onProgress?.(data.status)

      if (data.status === 'completed' || data.status === 'failed') {
        return data
      }
    } catch {
      // Network error, continue polling
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
  }

  return { status: 'failed', error: 'Video generation timed out (3 minutes)' }
}

export function insertVideoOnCanvas(
  editor: Editor,
  videoUrl: string,
  meta?: { jobId?: string },
): AiActionResult {
  try {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'image',
      x: center.x - 320,
      y: center.y - 180,
      props: { w: 640, h: 360, src: videoUrl },
      meta: { aiVideoGenerated: true, videoDownloadUrl: videoUrl, ...meta },
    } as any)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Failed to insert video' }
  }
}
