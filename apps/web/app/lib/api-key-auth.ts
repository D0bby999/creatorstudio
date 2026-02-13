import { prisma } from '@creator-studio/db/client'
import { createHash } from 'node:crypto'

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export async function requireApiKey(request: Request, requiredScopes?: string[]) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer cs_')) {
    throw new Response(JSON.stringify({ error: 'Invalid API key format' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const key = authHeader.slice(7)
  const hashedKey = hashApiKey(key)
  const apiKey = await prisma.apiKey.findUnique({ where: { key: hashedKey, enabled: true } })
  if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
    throw new Response(JSON.stringify({ error: 'Invalid or expired API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (requiredScopes?.length) {
    const missing = requiredScopes.filter((s) => !apiKey.scopes.includes(s))
    if (missing.length) {
      throw new Response(JSON.stringify({ error: 'Insufficient scopes', missing }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {})

  return { userId: apiKey.userId, apiKey }
}
