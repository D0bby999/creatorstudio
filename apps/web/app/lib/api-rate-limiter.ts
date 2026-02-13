const windows = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(apiKeyId: string, limit = 10): void {
  const now = Date.now()
  const windowKey = apiKeyId
  const existing = windows.get(windowKey)

  if (!existing || existing.resetAt <= now) {
    windows.set(windowKey, { count: 1, resetAt: now + 60_000 })
    return
  }

  if (existing.count >= limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    throw new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    })
  }

  existing.count++
}

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of windows) {
    if (val.resetAt <= now) windows.delete(key)
  }
}, 300_000).unref()
