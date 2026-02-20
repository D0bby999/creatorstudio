// Facebook Pages API helper functions
// Low-level operations for Facebook Graph API Pages posting

import { META_GRAPH_API_BASE, metaGraphFetch } from './meta-api-helpers'
import type { FacebookPostInsights } from '../types/facebook-types'
import { createSafeErrorMessage } from './error-sanitizer'

/**
 * Exchange user access token for page access token
 */
export async function exchangeForPageToken(
  userToken: string,
  pageId: string
): Promise<string> {
  const data = await metaGraphFetch<{ access_token: string }>(`/${pageId}`, {
    accessToken: userToken,
    body: { fields: 'access_token' },
  })

  return data.access_token
}

/**
 * Post text/link to Page feed
 */
export async function postToPageFeed(
  pageToken: string,
  pageId: string,
  message: string
): Promise<{ id: string }> {
  const url = `${META_GRAPH_API_BASE}/${pageId}/feed`
  const body = new URLSearchParams({
    message,
    access_token: pageToken,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(createSafeErrorMessage('Facebook feed post error', error))
  }

  const data = await response.json()
  return { id: data.id }
}

/**
 * Upload photo to Page
 */
export async function uploadPhotoToPage(
  pageToken: string,
  pageId: string,
  imageUrl: string,
  caption: string
): Promise<{ id: string }> {
  const url = `${META_GRAPH_API_BASE}/${pageId}/photos`
  const body = new URLSearchParams({
    url: imageUrl,
    caption,
    access_token: pageToken,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(createSafeErrorMessage('Facebook photo upload error', error))
  }

  const data = await response.json()
  return { id: data.id }
}

/**
 * Upload video to Page
 */
export async function uploadVideoToPage(
  pageToken: string,
  pageId: string,
  videoUrl: string,
  description: string
): Promise<{ id: string }> {
  const url = `${META_GRAPH_API_BASE}/${pageId}/videos`
  const body = new URLSearchParams({
    file_url: videoUrl,
    description,
    access_token: pageToken,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(createSafeErrorMessage('Facebook video upload error', error))
  }

  const data = await response.json()
  return { id: data.id }
}

/**
 * Get Page post insights
 */
export async function getPagePostInsights(
  pageToken: string,
  postId: string
): Promise<FacebookPostInsights> {
  try {
    const data = await metaGraphFetch<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
      `/${postId}/insights`,
      {
        accessToken: pageToken,
        body: {
          metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total',
        },
      }
    )

    const insights: FacebookPostInsights = {
      postImpressions: 0,
      postEngagedUsers: 0,
      postClicks: 0,
      postReactions: 0,
    }

    data.data.forEach((metric) => {
      const value = metric.values[0]?.value || 0
      switch (metric.name) {
        case 'post_impressions':
          insights.postImpressions = value
          break
        case 'post_engaged_users':
          insights.postEngagedUsers = value
          break
        case 'post_clicks':
          insights.postClicks = value
          break
        case 'post_reactions_by_type_total':
          insights.postReactions = typeof value === 'object'
            ? Object.values(value as Record<string, number>).reduce((sum, v) => sum + v, 0)
            : value
          break
      }
    })

    return insights
  } catch (error) {
    // Return zeros if insights not available yet
    return {
      postImpressions: 0,
      postEngagedUsers: 0,
      postClicks: 0,
      postReactions: 0,
    }
  }
}
