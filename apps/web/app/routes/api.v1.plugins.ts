import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'
import { validatePluginManifest } from '~/lib/plugins/plugin-manifest-schema'

export async function loader({ request }: { request: Request }) {
  const { apiKey } = await requireApiKey(request, ['plugins:read'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const offset = (page - 1) * limit

  const where = {
    status: 'approved',
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { author: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [plugins, total] = await Promise.all([
    prisma.plugin.findMany({
      where,
      select: {
        id: true,
        name: true,
        displayName: true,
        version: true,
        description: true,
        author: true,
        iconUrl: true,
        installCount: true,
        manifest: true,
        updatedAt: true,
      },
      orderBy: { installCount: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.plugin.count({ where }),
  ])

  return Response.json({
    plugins,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function action({ request }: { request: Request }) {
  const { userId } = await requireApiKey(request, ['plugins:write'])

  const body = await request.json()
  const { name, displayName, version, description, author, iconUrl, sourceUrl, manifest } = body

  if (!name || !displayName || !version || !manifest) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const validation = validatePluginManifest(manifest)
  if (!validation.success) {
    return Response.json({ error: `Invalid manifest: ${validation.error}` }, { status: 400 })
  }

  if (validation.data?.name !== name) {
    return Response.json({ error: 'Plugin name must match manifest name' }, { status: 400 })
  }

  try {
    const plugin = await prisma.plugin.create({
      data: {
        name,
        displayName,
        version,
        description: description || '',
        author: author || '',
        iconUrl,
        sourceUrl,
        manifest,
        status: 'pending',
        userId,
      },
    })

    return Response.json({ plugin }, { status: 201 })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return Response.json({ error: 'Plugin with this name already exists' }, { status: 409 })
    }
    throw error
  }
}
