/**
 * Normalize URL to unique key for deduplication
 * - Lowercase host
 * - Sort query params
 * - Strip fragment
 */
export function normalizeUniqueKey(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hostname = parsed.hostname.toLowerCase()
    parsed.hash = ''

    // Sort query params
    const params = Array.from(parsed.searchParams.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    )
    parsed.search = ''
    params.forEach(([key, value]) => parsed.searchParams.append(key, value))

    return parsed.toString()
  } catch {
    return url.toLowerCase()
  }
}
