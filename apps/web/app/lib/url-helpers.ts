/**
 * Sanitize a returnTo URL parameter to prevent open redirects.
 * Only allows relative paths that don't escape to external hosts.
 */
export function sanitizeReturnTo(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  if (value === '/sign-in' || value === '/sign-up') return null
  return value
}
