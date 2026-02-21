const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
]

export function isYouTubeUrl(input: string): boolean {
  if (input.length > 2048) return false
  try {
    const url = new URL(input)
    return YOUTUBE_DOMAINS.some((d) => url.hostname === d || url.hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

/**
 * Extract channel ID from YouTube URL
 * Supports:
 * - https://www.youtube.com/channel/UCxxx
 * - https://www.youtube.com/@handle
 * - https://www.youtube.com/c/CustomName
 * - https://www.youtube.com/user/Username
 */
export function extractChannelId(input: string): string | null {
  if (input.length > 2048) return null
  try {
    const url = new URL(input)

    // Direct channel ID format: /channel/UCxxx
    const channelMatch = url.pathname.match(/^\/channel\/([^/]+)/)
    if (channelMatch) return channelMatch[1]

    // Handle format: /@handle
    const handleMatch = url.pathname.match(/^\/@([^/]+)/)
    if (handleMatch) return `@${handleMatch[1]}`

    // Custom URL format: /c/name
    const customMatch = url.pathname.match(/^\/c\/([^/]+)/)
    if (customMatch) return customMatch[1]

    // User format: /user/name
    const userMatch = url.pathname.match(/^\/user\/([^/]+)/)
    if (userMatch) return userMatch[1]

    return null
  } catch {
    return null
  }
}

/**
 * Extract video ID from YouTube URL
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractVideoId(input: string): string | null {
  if (input.length > 2048) return null
  try {
    const url = new URL(input)

    // youtu.be format
    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1).split('/')[0]
      return videoId || null
    }

    // watch?v= format
    const vParam = url.searchParams.get('v')
    if (vParam) return vParam

    // /embed/VIDEO_ID or /v/VIDEO_ID format
    const pathMatch = url.pathname.match(/^\/(embed|v)\/([^/]+)/)
    if (pathMatch) return pathMatch[2]

    return null
  } catch {
    return null
  }
}

/**
 * Build channel URL from channel ID
 */
export function buildChannelUrl(channelId: string): string {
  if (channelId.startsWith('@')) {
    return `https://www.youtube.com/${channelId}`
  }
  if (channelId.startsWith('UC')) {
    return `https://www.youtube.com/channel/${channelId}`
  }
  // Assume it's a custom URL or username
  return `https://www.youtube.com/c/${channelId}`
}
