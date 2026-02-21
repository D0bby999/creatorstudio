const TIKTOK_DOMAINS = [
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vt.tiktok.com',
  'vm.tiktok.com',
]

export function isTikTokUrl(input: string): boolean {
  if (input.length > 2048) return false
  try {
    const url = new URL(input)
    return TIKTOK_DOMAINS.some((d) => url.hostname === d || url.hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

/**
 * Extract username from TikTok URL
 * Supports:
 * - https://www.tiktok.com/@username
 * - https://www.tiktok.com/@username/video/123456789
 * - https://vt.tiktok.com/ZSj1nW8hQ/ (redirects to profile)
 */
export function extractUsername(input: string): string | null {
  if (input.length > 2048) return null
  try {
    const url = new URL(input)
    const pathMatch = url.pathname.match(/^\/@([a-zA-Z0-9_.]+)/)
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}

/**
 * Extract video ID from TikTok URL
 * Supports:
 * - https://www.tiktok.com/@username/video/7123456789012345678
 * - https://m.tiktok.com/v/7123456789012345678.html
 * - https://vm.tiktok.com/ZSj1nW8hQ/ (short link)
 */
export function extractVideoId(input: string): string | null {
  if (input.length > 2048) return null
  try {
    const url = new URL(input)

    // Long video format: /@username/video/ID
    const longMatch = url.pathname.match(/\/video\/(\d+)/)
    if (longMatch) return longMatch[1]

    // Mobile format: /v/ID.html
    const mobileMatch = url.pathname.match(/\/v\/(\d+)/)
    if (mobileMatch) return mobileMatch[1]

    return null
  } catch {
    return null
  }
}

/**
 * Build profile URL from username
 */
export function buildProfileUrl(username: string): string {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username
  return `https://www.tiktok.com/@${cleanUsername}`
}

/**
 * Build oEmbed URL for video metadata extraction
 */
export function buildOembedUrl(videoUrl: string): string {
  return `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`
}
