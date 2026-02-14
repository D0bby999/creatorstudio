// SSRF prevention utility for validating server-side fetch URLs
// Blocks requests to private IP ranges to prevent internal network access

/**
 * Check if hostname resolves to a private/internal IP address
 * Blocks: 10.x, 172.16-31.x, 192.168.x, 127.x, localhost, ::1, fc00::/7, fe80::/10
 */
export function isPrivateIP(hostname: string): boolean {
  // Block localhost variants
  if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '::1') {
    return true
  }

  // IPv4 private ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number)

    // Validate octets are in range
    if (a > 255 || b > 255 || c > 255 || d > 255) {
      return false
    }

    // 10.0.0.0/8
    if (a === 10) return true

    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true

    // 192.168.0.0/16
    if (a === 192 && b === 168) return true

    // 127.0.0.0/8 (loopback)
    if (a === 127) return true

    // 0.0.0.0/8
    if (a === 0) return true

    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) return true
  }

  // IPv6 private ranges (basic pattern check)
  if (hostname.includes(':')) {
    const lower = hostname.toLowerCase()

    // fc00::/7 (unique local)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true

    // fe80::/10 (link-local)
    if (lower.startsWith('fe80:')) return true

    // ::1 (loopback)
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true

    // IPv4-mapped IPv6 (::ffff:x.x.x.x)
    const ipv4MappedMatch = lower.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
    if (ipv4MappedMatch) {
      return isPrivateIP(ipv4MappedMatch[1])
    }
  }

  return false
}

/**
 * Check if URL is allowed for server-side fetch
 * Returns false if scheme is not https or hostname is private
 */
export function isAllowedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)

    // Only allow https (http downgraded for security)
    if (url.protocol !== 'https:') {
      return false
    }

    // Check for private IP
    if (isPrivateIP(url.hostname)) {
      return false
    }

    return true
  } catch {
    // Invalid URL
    return false
  }
}

/**
 * Validate URL for server-side fetch, throws Error if blocked
 * Use this before any fetch() to user-provided or API-returned URLs
 */
export function validateServerFetchUrl(urlStr: string): void {
  if (!isAllowedUrl(urlStr)) {
    const reason = (() => {
      try {
        const url = new URL(urlStr)
        if (url.protocol !== 'https:') return 'non-HTTPS scheme not allowed'
        if (isPrivateIP(url.hostname)) return 'private/internal IP blocked (SSRF prevention)'
        return 'URL validation failed'
      } catch {
        return 'invalid URL format'
      }
    })()

    throw new Error(`Blocked server-side fetch to ${urlStr}: ${reason}`)
  }
}
