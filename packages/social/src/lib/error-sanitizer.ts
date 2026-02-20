export function sanitizeError(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const safe: Record<string, unknown> = {}
    const sensitiveFields = [
      'access_token',
      'accesstoken',
      'client_secret',
      'clientsecret',
      'refresh_token',
      'refreshtoken',
      'api_key',
      'apikey',
      'bearer',
      'authorization',
      'password',
      'secret',
      'token',
    ]

    for (const [key, value] of Object.entries(error)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        safe[key] = '[REDACTED]'
      } else {
        safe[key] = value
      }
    }

    return JSON.stringify(safe)
  }

  return String(error)
}

export function createSafeErrorMessage(prefix: string, error: unknown): string {
  const sanitized = sanitizeError(error)
  return `${prefix}: ${sanitized}`
}
