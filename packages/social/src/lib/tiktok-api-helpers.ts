// TikTok Content Posting API helper functions
// Video upload with direct and chunked upload support

import type {
  TikTokUploadResponse,
  TikTokStatusResponse,
  TikTokUserInfo,
  TikTokVideoInitParams,
} from '../types/tiktok-types'
import type { TokenRefreshResult } from './platform-interface'
import { createSafeErrorMessage } from './error-sanitizer'

const TIKTOK_API_BASE = 'https://open.tiktokapis.com'

async function handleTikTokResponse<T = any>(response: Response, errorPrefix: string): Promise<T> {
  if (!response.ok) {
    const error = await response.json()
    throw new Error(createSafeErrorMessage(errorPrefix, error))
  }
  const data = await response.json() as any
  if (data.error?.code) {
    throw new Error(`TikTok API error: ${data.error.message} (code: ${data.error.code})`)
  }
  return data as T
}

export async function initVideoPost(
  accessToken: string,
  params: TikTokVideoInitParams
): Promise<TikTokUploadResponse> {
  const sourceInfo: Record<string, unknown> = { source: 'FILE_UPLOAD', video_size: params.videoSize }
  if (params.chunkSize && params.totalChunkCount) {
    sourceInfo.chunk_size = params.chunkSize
    sourceInfo.total_chunk_count = params.totalChunkCount
  }

  const response = await fetch(`${TIKTOK_API_BASE}/v2/post/publish/video/init/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({
      post_info: { title: params.title, privacy_level: params.privacyLevel },
      source_info: sourceInfo,
    }),
  })

  const data = await handleTikTokResponse<any>(response, 'TikTok init video error')
  return { publishId: data.data.publish_id, uploadUrl: data.data.upload_url }
}

export async function directUpload(
  uploadUrl: string,
  videoData: ArrayBuffer,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'Content-Length': videoData.byteLength.toString() },
    body: videoData,
  })
  if (!response.ok) throw new Error(`TikTok direct upload failed: ${response.statusText}`)
}

export async function chunkedUpload(
  uploadUrl: string,
  videoData: ArrayBuffer,
  chunkSize = 10 * 1024 * 1024
): Promise<void> {
  const totalSize = videoData.byteLength
  let offset = 0
  let chunkNumber = 0

  while (offset < totalSize) {
    const end = Math.min(offset + chunkSize, totalSize)
    const chunk = videoData.slice(offset, end)
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${offset}-${end - 1}/${totalSize}`,
        'Content-Length': chunk.byteLength.toString(),
      },
      body: chunk,
    })
    if (!response.ok) {
      throw new Error(`TikTok chunk ${chunkNumber} upload failed: ${response.statusText}`)
    }
    offset = end
    chunkNumber++
  }
}

export async function pollPublishStatus(
  accessToken: string,
  publishId: string,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<TikTokStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${TIKTOK_API_BASE}/v2/post/publish/status/${publishId}/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({}),
    })

    const data = await handleTikTokResponse<any>(response, 'TikTok status poll error')
    const status = data.data.status

    if (status === 'PUBLISH_COMPLETE') {
      return { status, publiclyAvailablePostId: data.data.publicly_available_post_id }
    }
    if (status === 'FAILED') {
      return { status, failReason: data.data.fail_reason || 'Unknown error' }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(`TikTok publish did not complete within ${maxAttempts} attempts`)
}

export async function refreshTikTokToken(
  clientKey: string,
  clientSecret: string,
  refreshToken: string
): Promise<TokenRefreshResult & { refreshToken: string }> {
  const response = await fetch(`${TIKTOK_API_BASE}/v2/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  const data = await handleTikTokResponse<any>(response, 'TikTok token refresh error')
  return {
    accessToken: data.data.access_token,
    expiresIn: data.data.expires_in,
    refreshToken: data.data.refresh_token,
  }
}

export async function fetchTikTokUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const response = await fetch(`${TIKTOK_API_BASE}/v2/user/info/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ fields: ['open_id', 'union_id', 'avatar_url', 'display_name'] }),
  })

  const data = await handleTikTokResponse<any>(response, 'TikTok user info error')
  return {
    openId: data.data.user.open_id,
    unionId: data.data.user.union_id,
    displayName: data.data.user.display_name,
    avatarUrl: data.data.user.avatar_url,
  }
}
