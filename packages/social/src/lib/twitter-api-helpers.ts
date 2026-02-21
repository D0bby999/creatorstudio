// Twitter API v1.1 media upload + v2 tweet creation + OAuth2 refresh helpers
// Uses injected fetchFn for resilient fetch integration

const TWITTER_UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json'
const TWITTER_TWEETS_URL = 'https://api.twitter.com/2/tweets'
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'

// Chunk size for media upload APPEND (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024

export interface TweetOptions {
  mediaIds?: string[]
  replyToId?: string
}

export interface MediaUploadResult {
  mediaId: string
  expiresAfterSecs: number
}

// Twitter v1.1 chunked media upload (INIT → APPEND → FINALIZE)
export async function uploadMediaChunked(
  fetchFn: typeof fetch,
  accessToken: string,
  buffer: Buffer,
  mimeType: string
): Promise<MediaUploadResult> {
  // INIT
  const initParams = new URLSearchParams({
    command: 'INIT',
    total_bytes: String(buffer.byteLength),
    media_type: mimeType,
  })

  const initRes = await fetchFn(`${TWITTER_UPLOAD_URL}?${initParams}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })

  if (!initRes.ok) {
    throw new Error(`Twitter media INIT failed: ${initRes.status}`)
  }

  const initData = await initRes.json()
  const mediaId = initData.media_id_string

  // APPEND (chunked)
  for (let i = 0; i * CHUNK_SIZE < buffer.byteLength; i++) {
    const chunk = buffer.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    const formData = new FormData()
    formData.append('command', 'APPEND')
    formData.append('media_id', mediaId)
    formData.append('segment_index', String(i))
    formData.append('media_data', Buffer.from(chunk).toString('base64'))

    const appendRes = await fetchFn(TWITTER_UPLOAD_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: formData,
    })

    if (!appendRes.ok) {
      throw new Error(`Twitter media APPEND failed at segment ${i}: ${appendRes.status}`)
    }
  }

  // FINALIZE
  const finalizeParams = new URLSearchParams({
    command: 'FINALIZE',
    media_id: mediaId,
  })

  const finalizeRes = await fetchFn(`${TWITTER_UPLOAD_URL}?${finalizeParams}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })

  if (!finalizeRes.ok) {
    throw new Error(`Twitter media FINALIZE failed: ${finalizeRes.status}`)
  }

  const finalizeData = await finalizeRes.json()
  return {
    mediaId: finalizeData.media_id_string,
    expiresAfterSecs: finalizeData.expires_after_secs ?? 86400,
  }
}

// Twitter v2 tweet creation
export async function createTweet(
  fetchFn: typeof fetch,
  accessToken: string,
  text: string,
  options?: TweetOptions
): Promise<{ id: string; text: string }> {
  const body: Record<string, unknown> = { text }

  if (options?.mediaIds?.length) {
    body.media = { media_ids: options.mediaIds }
  }
  if (options?.replyToId) {
    body.reply = { in_reply_to_tweet_id: options.replyToId }
  }

  const res = await fetchFn(TWITTER_TWEETS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`Twitter tweet creation failed: ${res.status} ${JSON.stringify(error)}`)
  }

  const data = await res.json()
  return { id: data.data.id, text: data.data.text }
}

// OAuth2 PKCE token refresh
export async function refreshOAuth2Token(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  fetchFn: typeof fetch = fetch
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetchFn(TWITTER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`Twitter OAuth2 refresh failed: ${res.status} ${JSON.stringify(error)}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}
