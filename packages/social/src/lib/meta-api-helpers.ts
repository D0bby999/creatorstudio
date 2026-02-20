// Meta Graph API shared utilities
// Common functions for Facebook, Instagram, and Threads APIs

import type { TokenRefreshResult } from './platform-interface'
import { createSafeErrorMessage } from './error-sanitizer'

export const META_GRAPH_API_VERSION = 'v22.0'
export const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`

export interface MetaApiError {
  code: number
  type: string
  message: string
  fbTraceId: string
}

/**
 * Generic Graph API fetch with error handling and rate limit logging
 */
export async function metaGraphFetch<T>(
  path: string,
  options: {
    accessToken: string
    method?: string
    body?: Record<string, string>
  }
): Promise<T> {
  const { accessToken, method = 'GET', body } = options

  const url = new URL(`${META_GRAPH_API_BASE}${path}`)
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (method === 'GET' && body) {
    Object.entries(body).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    url.searchParams.append('access_token', accessToken)
  } else if (method === 'POST' && body) {
    const formData = new URLSearchParams(body)
    formData.append('access_token', accessToken)
    fetchOptions.body = formData
    fetchOptions.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }

  const response = await fetch(url.toString(), fetchOptions)

  // Log rate limit headers if present
  const rateLimitRemaining = response.headers.get('x-business-use-case-usage')
  if (rateLimitRemaining) {
    console.log('Meta API rate limit usage:', rateLimitRemaining)
  }

  if (!response.ok) {
    const error = await parseMetaError(response)
    const errorData = { message: error.message, code: error.code, trace: error.fbTraceId }
    throw new Error(createSafeErrorMessage('Meta API error', errorData))
  }

  return await response.json()
}

/**
 * Exchange short-lived token for long-lived token (60-day)
 */
export async function refreshLongLivedToken(
  accessToken: string,
  appId: string,
  appSecret: string
): Promise<TokenRefreshResult> {
  const url = `${META_GRAPH_API_BASE}/oauth/access_token`
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: accessToken,
  })

  const response = await fetch(`${url}?${params}`, { method: 'GET' })

  if (!response.ok) {
    const error = await parseMetaError(response)
    throw new Error(`Token refresh failed: ${error.message}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // 60 days default
  }
}

/**
 * Poll container status until FINISHED or ERROR
 * Used by Instagram and Threads container-based publishing
 */
export async function pollContainerStatus(
  accessToken: string,
  containerId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<'FINISHED' | 'ERROR'> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await metaGraphFetch<{ status_code: string }>(`/${containerId}`, {
      accessToken,
      body: { fields: 'status_code' },
    })

    const status = response.status_code

    if (status === 'FINISHED') {
      return 'FINISHED'
    }

    if (status === 'ERROR' || status === 'EXPIRED') {
      return 'ERROR'
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(`Container ${containerId} did not finish within ${maxAttempts} attempts`)
}

/**
 * Parse Meta API error response into typed error
 */
export async function parseMetaError(response: Response): Promise<MetaApiError> {
  try {
    const data = await response.json()
    const error = data.error || {}
    return {
      code: error.code || response.status,
      type: error.type || 'UnknownError',
      message: error.message || 'Unknown Meta API error',
      fbTraceId: error.fbtrace_id || 'N/A',
    }
  } catch {
    return {
      code: response.status,
      type: 'ParseError',
      message: `Failed to parse error response: ${response.statusText}`,
      fbTraceId: 'N/A',
    }
  }
}
