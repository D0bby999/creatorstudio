// Instagram API helper functions
// Low-level API operations for Instagram Graph API

import type { InstagramPostResponse } from '../types/social-types'
import { META_GRAPH_API_VERSION, META_GRAPH_API_BASE } from './meta-api-helpers'

const INSTAGRAM_GRAPH_API_VERSION = META_GRAPH_API_VERSION
const INSTAGRAM_GRAPH_API_BASE = META_GRAPH_API_BASE

export async function createMediaContainer(
  accessToken: string,
  params: {
    imageUrl?: string
    videoUrl?: string
    caption: string
    userId: string
  }
): Promise<{ id: string }> {
  const { imageUrl, videoUrl, caption, userId } = params

  const mediaType = videoUrl ? 'video' : 'image'
  const mediaUrl = videoUrl || imageUrl

  if (!mediaUrl) {
    throw new Error('Either imageUrl or videoUrl is required')
  }

  const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}/media`
  const body = new URLSearchParams({
    [mediaType === 'video' ? 'video_url' : 'image_url']: mediaUrl,
    caption,
    access_token: accessToken,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return { id: data.id }
}

export async function publishMedia(
  accessToken: string,
  params: {
    userId: string
    creationId: string
  }
): Promise<InstagramPostResponse> {
  const { userId, creationId } = params

  const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}/media_publish`
  const body = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return { id: data.id }
}

export async function createStory(
  accessToken: string,
  params: {
    userId: string
    imageUrl?: string
    videoUrl?: string
  }
): Promise<InstagramPostResponse> {
  const { userId, imageUrl, videoUrl } = params
  const mediaUrl = videoUrl || imageUrl

  if (!mediaUrl) {
    throw new Error('Either imageUrl or videoUrl is required for stories')
  }

  const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}/media`
  const body = new URLSearchParams({
    [videoUrl ? 'video_url' : 'image_url']: mediaUrl,
    media_type: 'STORIES',
    access_token: accessToken,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()

  return await publishMedia(accessToken, {
    userId,
    creationId: data.id,
  })
}

export async function createCarouselContainer(
  accessToken: string,
  params: {
    userId: string
    caption: string
    children: string[] // Array of media container IDs
  }
): Promise<{ id: string }> {
  const { userId, caption, children } = params

  if (children.length < 2 || children.length > 10) {
    throw new Error('Carousel must have 2-10 items')
  }

  const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}/media`
  const body = new URLSearchParams({
    media_type: 'CAROUSEL',
    caption,
    children: children.join(','),
    access_token: accessToken,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  return { id: data.id }
}

export const INSTAGRAM_API_BASE_URL = INSTAGRAM_GRAPH_API_BASE
