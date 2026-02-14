import sanitize from 'sanitize-html'

const ALL_TAGS = /<[^>]*>/g

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Use sanitize-html library for proper HTML sanitization
  return sanitize(input, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
    allowedAttributes: {
      'a': ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  }).trim()
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
