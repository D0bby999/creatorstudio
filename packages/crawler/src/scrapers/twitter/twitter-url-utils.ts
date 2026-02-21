const TWITTER_DOMAINS = [
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  'x.com',
  'www.x.com',
  'mobile.x.com',
]

export function isTwitterUrl(input: string): boolean {
  if (input.length > 2048) return false
  try {
    const url = new URL(input)
    return TWITTER_DOMAINS.some((d) => url.hostname === d || url.hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

export function extractHandle(input: string): string | null {
  if (input.length > 2048) return null
  try {
    let url: URL
    try {
      url = new URL(input)
    } catch {
      // Try prepending https:// for bare domains
      url = new URL('https://' + input)
    }

    if (!isTwitterUrl(url.toString())) {
      return null
    }

    // Handle /@handle or /handle format
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    // Remove @ prefix if present
    const handle = segments[0].replace(/^@/, '')

    // Validate handle format (alphanumeric and underscores, 1-15 chars)
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
      return null
    }

    // Skip routes that aren't user profiles
    const reservedPaths = [
      'home', 'explore', 'notifications', 'messages', 'i', 'settings',
      'search', 'compose', 'login', 'signup', 'tos', 'privacy'
    ]
    if (reservedPaths.includes(handle.toLowerCase())) {
      return null
    }

    return handle
  } catch {
    return null
  }
}

export function buildSyndicationUrl(handle: string): string {
  const cleanHandle = handle.replace(/^@/, '')
  return `https://syndication.twitter.com/srv/timeline-profile/screen-name/${cleanHandle}`
}

export function buildGuestTokenUrl(): string {
  return 'https://api.x.com/1.1/guest/activate.json'
}

export function buildUserTimelineUrl(handle: string): string {
  const cleanHandle = handle.replace(/^@/, '')
  return `https://x.com/${cleanHandle}`
}

export function buildApiTimelineUrl(): string {
  return 'https://api.x.com/1.1/statuses/user_timeline.json'
}
