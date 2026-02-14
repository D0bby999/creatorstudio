const DANGEROUS_TAGS = /<(script|iframe|object|embed|link|style|meta|base)[^>]*>.*?<\/\1>|<(script|iframe|object|embed|link|style|meta|base)[^>]*\/>/gis
const ALL_TAGS = /<[^>]*>/g
const DANGEROUS_ATTRS = /\s(on\w+|href\s*=\s*["']?\s*javascript:|src\s*=\s*["']?\s*data:text\/html)/gi

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''

  let sanitized = input
    .replace(DANGEROUS_TAGS, '')
    .replace(DANGEROUS_ATTRS, '')

  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre']
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi

  sanitized = sanitized.replace(tagPattern, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      return match
    }
    return ''
  })

  return sanitized.trim()
}

export function sanitizePlainText(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.replace(ALL_TAGS, '').trim()
}

export function validateUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false

  try {
    const url = new URL(input)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function sanitizeForDb(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, 10000)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}
