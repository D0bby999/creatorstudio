const FB_DOMAINS = [
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'mbasic.facebook.com',
  'web.facebook.com',
  'touch.facebook.com',
]

export function isFacebookUrl(input: string): boolean {
  try {
    const url = new URL(input)
    return FB_DOMAINS.some((d) => url.hostname === d || url.hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

export function normalizeToMbasicUrl(input: string): string {
  if (!input) throw new Error('URL is required')

  let url: URL
  try {
    url = new URL(input)
  } catch {
    // Try prepending https:// for bare domains like "facebook.com/NASA"
    try {
      url = new URL('https://' + input)
    } catch {
      throw new Error(`Invalid URL: ${input}`)
    }
  }

  if (!FB_DOMAINS.some((d) => url.hostname === d || url.hostname.endsWith('.' + d))) {
    throw new Error(`Not a Facebook URL: ${input}`)
  }

  url.hostname = 'mbasic.facebook.com'
  url.protocol = 'https:'
  // Strip trailing slash from pathname (except root)
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1)
  }
  return url.toString()
}

export function extractPageIdentifier(input: string): string {
  let url: URL
  try {
    url = new URL(normalizeToMbasicUrl(input))
  } catch {
    throw new Error(`Cannot extract page identifier from: ${input}`)
  }

  // Handle profile.php?id=123 format
  if (url.pathname === '/profile.php') {
    const id = url.searchParams.get('id')
    if (id) return id
  }

  // Handle /pages/PageName/123456 format
  const pagesMatch = url.pathname.match(/^\/pages\/[^/]+\/(\d+)/)
  if (pagesMatch) return pagesMatch[1]

  // Handle /<pagename> format — take first path segment
  const segments = url.pathname.split('/').filter(Boolean)
  return segments[0] || ''
}

export function buildPostPermalink(postId: string, pageId: string): string {
  return `https://www.facebook.com/${pageId}/posts/${postId}`
}

export function resolveRelativeUrl(href: string, baseHost = 'mbasic.facebook.com'): string {
  if (href.startsWith('http')) return href
  if (href.startsWith('/')) return `https://${baseHost}${href}`
  return `https://${baseHost}/${href}`
}
