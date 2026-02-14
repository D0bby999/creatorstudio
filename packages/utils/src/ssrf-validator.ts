import { lookup } from 'node:dns/promises'

export function isPrivateIP(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '::1') {
    return true
  }

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number)
    if (a > 255 || b > 255 || c > 255 || d > 255) return false
    if (a === 10) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
  }

  if (hostname.includes(':')) {
    const lower = hostname.toLowerCase()
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true
    if (lower.startsWith('fe80:')) return true
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true

    const ipv4MappedMatch = lower.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
    if (ipv4MappedMatch) {
      return isPrivateIP(ipv4MappedMatch[1])
    }
  }

  return false
}

/**
 * Resolve hostname via DNS and validate the resolved IP is not private.
 * Fail-closed: blocks request if DNS resolution fails.
 */
export async function resolveAndValidateUrl(
  urlStr: string,
  options?: { allowHttp?: boolean }
): Promise<void> {
  const url = new URL(urlStr)

  if (!options?.allowHttp && url.protocol !== 'https:') {
    throw new Error(`Non-HTTPS URL blocked: ${urlStr}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Invalid protocol: ${url.protocol}`)
  }

  if (isPrivateIP(url.hostname)) {
    throw new Error(`Private IP blocked (SSRF prevention): ${urlStr}`)
  }

  try {
    const { address } = await lookup(url.hostname)
    if (isPrivateIP(address)) {
      throw new Error(`DNS resolved to private IP ${address} (SSRF prevention): ${urlStr}`)
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('SSRF prevention')) throw err
    throw new Error(`DNS resolution failed for ${url.hostname} (fail-closed)`)
  }
}

/**
 * Synchronous fast-path validation (no DNS resolution).
 * Use for quick checks; prefer resolveAndValidateUrl for full protection.
 */
export function validateServerFetchUrl(urlStr: string): void {
  try {
    const url = new URL(urlStr)
    if (url.protocol !== 'https:') {
      throw new Error(`Non-HTTPS URL blocked: ${urlStr}`)
    }
    if (isPrivateIP(url.hostname)) {
      throw new Error(`Private IP blocked (SSRF prevention): ${urlStr}`)
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL format: ${urlStr}`)
    }
    throw error
  }
}
