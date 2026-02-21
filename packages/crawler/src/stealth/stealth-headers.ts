/**
 * Generate realistic browser headers from fingerprint or with static variance
 * Prefers fingerprint-based headers when available for consistency
 */

import type { GeneratedFingerprint } from './fingerprint-manager.js'

/**
 * Get stealth headers from a generated fingerprint (preferred)
 */
export function getStealthHeadersFromFingerprint(
  fp: GeneratedFingerprint
): Record<string, string> {
  return { ...fp.headers }
}

/**
 * Generate stealth headers with variance (fallback when no fingerprint)
 */
export function getStealthHeaders(url: string): Record<string, string> {
  const urlObj = new URL(url)

  const headers: Record<string, string> = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'max-age=0',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  }

  headers['Sec-Fetch-Dest'] = 'document'
  headers['Sec-Fetch-Mode'] = 'navigate'
  headers['Sec-Fetch-Site'] = 'none'
  headers['Sec-Fetch-User'] = '?1'

  const chromeVersion = 130 + Math.floor(Math.random() * 2)
  headers['Sec-Ch-Ua'] = `"Chromium";v="${chromeVersion}", "Not(A:Brand";v="99", "Google Chrome";v="${chromeVersion}"`
  headers['Sec-Ch-Ua-Mobile'] = '?0'
  headers['Sec-Ch-Ua-Platform'] = randomPlatform()

  if (Math.random() > 0.7) {
    headers.DNT = '1'
  }

  if (Math.random() > 0.6) {
    headers.Referer = `${urlObj.protocol}//${urlObj.hostname}/`
  }

  return headers
}

function randomPlatform(): string {
  const platforms = ['"Windows"', '"macOS"', '"Linux"']
  return platforms[Math.floor(Math.random() * platforms.length)]
}
