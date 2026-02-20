// Threads API helper functions
// Container-based publishing for Threads (Meta's text-focused platform)

import { META_GRAPH_API_BASE, pollContainerStatus } from './meta-api-helpers'
import type { ThreadsMediaParams } from '../types/threads-types'
import { createSafeErrorMessage } from './error-sanitizer'

/**
 * Create Threads media container
 */
export async function createThreadsContainer(
  accessToken: string,
  userId: string,
  params: ThreadsMediaParams
): Promise<{ id: string }> {
  const url = `${META_GRAPH_API_BASE}/${userId}/threads`

  const body = new URLSearchParams({
    media_type: params.mediaType,
    access_token: accessToken,
  })

  if (params.text) {
    body.append('text', params.text)
  }
  if (params.imageUrl) {
    body.append('image_url', params.imageUrl)
  }
  if (params.videoUrl) {
    body.append('video_url', params.videoUrl)
  }
  if (params.replyControl) {
    body.append('reply_control', params.replyControl)
  }
  if (params.children && params.children.length > 0) {
    body.append('children', params.children.join(','))
  }

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(createSafeErrorMessage('Threads container creation error', error))
  }

  const data = await response.json()
  return { id: data.id }
}

/**
 * Publish Threads container after processing completes
 */
export async function publishThread(
  accessToken: string,
  userId: string,
  containerId: string
): Promise<{ id: string }> {
  // First poll until container is ready
  const status = await pollContainerStatus(accessToken, containerId)

  if (status === 'ERROR') {
    throw new Error(`Threads container ${containerId} failed processing`)
  }

  // Publish the container
  const url = `${META_GRAPH_API_BASE}/${userId}/threads_publish`
  const body = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(createSafeErrorMessage('Threads publish error', error))
  }

  const data = await response.json()
  return { id: data.id }
}

/**
 * Enforce Threads hashtag limit (only first hashtag is clickable)
 * Keeps only the first hashtag to avoid confusion
 */
export function enforceHashtagLimit(content: string): string {
  const hashtagRegex = /#\w+/g
  const matches = content.match(hashtagRegex)

  if (!matches || matches.length <= 1) {
    return content
  }

  // Keep first hashtag, remove others
  let result = content
  for (let i = 1; i < matches.length; i++) {
    result = result.replace(matches[i], matches[i].slice(1)) // Remove # from subsequent tags
  }

  return result
}
