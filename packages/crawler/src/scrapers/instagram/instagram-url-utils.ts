const IG_DOMAINS = [
  'instagram.com',
  'www.instagram.com',
  'i.instagram.com',
  'instagr.am',
]

export function isInstagramUrl(input: string): boolean {
  if (input.length > 2048) return false
  try {
    const url = new URL(input)
    return IG_DOMAINS.some((d) => url.hostname === d || url.hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

export function extractUsername(input: string): string | null {
  if (input.length > 2048) return null
  try {
    let url: URL
    try {
      url = new URL(input)
    } catch {
      // Try prepending https:// for bare domains
      url = new URL('https://' + input)
    }

    if (!isInstagramUrl(url.toString())) {
      return null
    }

    // Handle /@username or /username format
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    // Remove @ prefix if present
    const username = segments[0].replace(/^@/, '')

    // Validate username format (alphanumeric, dots, underscores)
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return null
    }

    return username
  } catch {
    return null
  }
}

export function buildMobileProfileUrl(username: string): string {
  // Remove @ prefix if present
  const cleanUsername = username.replace(/^@/, '')
  return `https://i.instagram.com/${cleanUsername}/`
}

export function buildGraphQLUrl(): string {
  return 'https://www.instagram.com/graphql/query/'
}

export function buildWebProfileUrl(username: string): string {
  const cleanUsername = username.replace(/^@/, '')
  return `https://www.instagram.com/${cleanUsername}/`
}
