import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'
import { validatePluginManifest } from '~/lib/plugins/plugin-manifest-schema'
import { logger } from '~/lib/logger'
import { validateServerFetchUrl } from '~/lib/url-validator'

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function action({ request }: { request: Request }) {
  const { userId, apiKey } = await requireApiKey(request, ['plugins:write'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const body = await request.json()
    const { manifestUrl, name, displayName, version, description, author, iconUrl, categoryId, tags } = body

    if (!manifestUrl || !name || !displayName) {
      return Response.json({ error: 'Missing required fields: manifestUrl, name, displayName' }, { status: 400 })
    }

    try {
      validateServerFetchUrl(manifestUrl)
    } catch (error) {
      return Response.json(
        { error: 'Invalid manifestUrl: blocked IP or protocol' },
        { status: 400 }
      )
    }

    if (!isValidUrl(manifestUrl)) {
      return Response.json({ error: 'Invalid manifestUrl format' }, { status: 400 })
    }

    if (iconUrl && !isValidUrl(iconUrl)) {
      return Response.json({ error: 'Invalid iconUrl format' }, { status: 400 })
    }

    let manifest = null
    try {
      const manifestRes = await fetch(manifestUrl)
      if (!manifestRes.ok) {
        return Response.json({ error: 'Failed to fetch manifest from URL' }, { status: 400 })
      }
      manifest = await manifestRes.json()
    } catch {
      return Response.json({ error: 'Failed to parse manifest JSON' }, { status: 400 })
    }

    const validation = validatePluginManifest(manifest)
    if (!validation.success) {
      return Response.json({ error: `Invalid manifest: ${validation.error}` }, { status: 400 })
    }

    if (validation.data?.name !== name) {
      return Response.json({ error: 'Plugin name must match manifest name' }, { status: 400 })
    }

    const plugin = await prisma.plugin.create({
      data: {
        name,
        displayName,
        version: version || '1.0.0',
        description: description || '',
        author: author || '',
        iconUrl,
        sourceUrl: manifestUrl,
        manifest,
        status: 'pending',
        categoryId: categoryId || null,
        tags: tags || [],
        userId,
      },
    })

    return Response.json({ plugin }, { status: 201 })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return Response.json({ error: 'Plugin with this name already exists' }, { status: 409 })
    }
    logger.error(
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as { code?: string }).code,
      },
      'Failed to submit plugin'
    )
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
