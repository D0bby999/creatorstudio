/**
 * URL normalization utilities for consistent URL handling
 */

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'msclkid',
  'ref',
  '_ga',
  '_gl',
]

export interface NormalizeOptions {
  stripFragment?: boolean        // default: true
  stripTrailingSlash?: boolean   // default: true
  sortQuery?: boolean            // default: true
  stripTrackingParams?: boolean  // default: true
}

/**
 * Normalize URL for consistent comparison and deduplication
 */
export function normalizeUrl(
  url: string,
  options: NormalizeOptions = {}
): string {
  const {
    stripFragment = true,
    stripTrailingSlash = true,
    sortQuery = true,
    stripTrackingParams = true,
  } = options

  try {
    const parsed = new URL(url)

    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase()

    // Handle query parameters
    if (stripTrackingParams) {
      for (const param of TRACKING_PARAMS) {
        parsed.searchParams.delete(param)
      }
    }

    if (sortQuery) {
      const sorted = new URLSearchParams(
        Array.from(parsed.searchParams.entries()).sort((a, b) =>
          a[0].localeCompare(b[0])
        )
      )
      parsed.search = sorted.toString()
    }

    // Strip fragment
    if (stripFragment) {
      parsed.hash = ''
    }

    let normalized = parsed.toString()

    // Strip trailing slash (except for root path)
    if (stripTrailingSlash && parsed.pathname !== '/') {
      normalized = normalized.replace(/\/$/, '')
    }

    return normalized
  } catch (error) {
    // Return original if URL parsing fails
    return url
  }
}
