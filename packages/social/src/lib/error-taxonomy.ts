// Unified error classification for all social platform APIs
// Classifies into 5 categories with retry decision logic

import { createSafeErrorMessage } from './error-sanitizer'

export type ErrorCategory = 'rate_limit' | 'auth' | 'platform' | 'client' | 'network'

export class SocialApiError extends Error {
  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly retryable: boolean,
    public readonly platform: string,
    public readonly statusCode?: number,
    public readonly retryAfterSeconds?: number,
    options?: { cause?: unknown }
  ) {
    super(message, options)
    this.name = `SocialApiError[${category}]`
  }
}

export class RateLimitError extends SocialApiError {
  constructor(platform: string, retryAfterSeconds?: number, options?: { cause?: unknown }) {
    super(`Rate limited on ${platform}`, 'rate_limit', true, platform, 429, retryAfterSeconds, options)
  }
}

export class AuthError extends SocialApiError {
  constructor(platform: string, message: string, statusCode = 401, options?: { cause?: unknown }) {
    super(message, 'auth', false, platform, statusCode, undefined, options)
  }
}

export class PlatformError extends SocialApiError {
  constructor(platform: string, message: string, statusCode = 500, options?: { cause?: unknown }) {
    super(message, 'platform', true, platform, statusCode, 30, options)
  }
}

export class ClientError extends SocialApiError {
  constructor(platform: string, message: string, statusCode = 400, options?: { cause?: unknown }) {
    super(message, 'client', false, platform, statusCode, undefined, options)
  }
}

export class NetworkError extends SocialApiError {
  constructor(platform: string, message: string, options?: { cause?: unknown }) {
    super(message, 'network', true, platform, undefined, 10, options)
  }
}

// Platform-specific error body types
interface MetaErrorBody { code?: number; type?: string; message?: string }
interface TikTokErrorBody { error?: { code?: string; message?: string } }
interface BlueskyErrorBody { error?: string; message?: string }

export function classifyError(error: unknown, platform: string): SocialApiError {
  if (error instanceof SocialApiError) return error

  // Response-like object with status
  const status = getStatusCode(error)
  const body = getErrorBody(error)

  if (status !== undefined) {
    // Platform-specific classification
    if (platform === 'instagram' || platform === 'facebook' || platform === 'threads') {
      return classifyMetaError(status, body as MetaErrorBody, platform, error)
    }
    if (platform === 'tiktok') {
      return classifyTikTokError(status, body as TikTokErrorBody, error)
    }
    if (platform === 'bluesky') {
      return classifyBlueskyError(status, body as BlueskyErrorBody, error)
    }

    // Generic HTTP status classification
    return classifyByStatus(status, platform, error)
  }

  // Network/fetch failures
  if (isNetworkError(error)) {
    return new NetworkError(platform, createSafeErrorMessage('Network error', error), { cause: error })
  }

  return new ClientError(platform, createSafeErrorMessage('Unknown error', error), 0, { cause: error })
}

function classifyMetaError(status: number, body: MetaErrorBody, platform: string, cause: unknown): SocialApiError {
  const code = body?.code
  // Meta error code 190 = expired token, 102 = invalid session
  if (code === 190 || code === 102) {
    return new AuthError(platform, `Meta auth error (code ${code})`, status, { cause })
  }
  // Meta error codes 4, 17 = rate limit
  if (code === 4 || code === 17 || status === 429) {
    return new RateLimitError(platform, undefined, { cause })
  }
  return classifyByStatus(status, platform, cause)
}

function classifyTikTokError(status: number, body: TikTokErrorBody, cause: unknown): SocialApiError {
  const code = body?.error?.code
  if (code === 'access_token_invalid' || code === 'token_expired') {
    return new AuthError('tiktok', `TikTok auth error: ${code}`, status, { cause })
  }
  if (status === 429) {
    return new RateLimitError('tiktok', undefined, { cause })
  }
  return classifyByStatus(status, 'tiktok', cause)
}

function classifyBlueskyError(status: number, body: BlueskyErrorBody, cause: unknown): SocialApiError {
  const errType = body?.error
  if (errType === 'ExpiredToken' || errType === 'InvalidToken') {
    return new AuthError('bluesky', `Bluesky auth error: ${errType}`, status, { cause })
  }
  if (errType === 'RateLimitExceeded' || status === 429) {
    return new RateLimitError('bluesky', undefined, { cause })
  }
  return classifyByStatus(status, 'bluesky', cause)
}

function classifyByStatus(status: number, platform: string, cause: unknown): SocialApiError {
  if (status === 429) return new RateLimitError(platform, undefined, { cause })
  if (status === 401 || status === 403) {
    return new AuthError(platform, createSafeErrorMessage('Auth error', cause), status, { cause })
  }
  if (status >= 500) {
    return new PlatformError(platform, createSafeErrorMessage('Platform error', cause), status, { cause })
  }
  if (status >= 400) {
    return new ClientError(platform, createSafeErrorMessage('Client error', cause), status, { cause })
  }
  return new ClientError(platform, createSafeErrorMessage('Unexpected status', cause), status, { cause })
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const s = (error as Record<string, unknown>).status
    return typeof s === 'number' ? s : undefined
  }
  return undefined
}

function getErrorBody(error: unknown): unknown {
  if (typeof error === 'object' && error !== null) return error
  return undefined
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return msg.includes('fetch failed') || msg.includes('network') ||
    msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('dns')
}

// Retry decision helpers -- used as shouldRetry callback in retryWithBackoff
export function isRetryable(error: unknown): boolean {
  if (error instanceof SocialApiError) return error.retryable
  if (error instanceof TypeError) return true
  return false
}

export function getRetryDelay(error: unknown): number | undefined {
  if (error instanceof SocialApiError) return error.retryAfterSeconds
  return undefined
}
