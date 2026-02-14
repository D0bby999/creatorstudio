import type { Route } from './+types/api.v1.posts'
import { prisma } from '@creator-studio/db/client'
import { requireApiKey } from '~/lib/api-key-auth'
import { checkRateLimit } from '~/lib/api-rate-limiter'

export async function loader({ request }: Route.LoaderArgs) {
  const { userId, apiKey } = await requireApiKey(request, ['posts:read'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 100)
  const offset = parseInt(url.searchParams.get('offset') || '0') || 0

  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId },
    select: { id: true },
  })

  const posts = await prisma.socialPost.findMany({
    where: { socialAccountId: { in: socialAccounts.map((a) => a.id) } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    select: {
      id: true,
      content: true,
      mediaUrls: true,
      platform: true,
      scheduledAt: true,
      publishedAt: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return Response.json({ posts, limit, offset })
}

export async function action({ request }: Route.ActionArgs) {
  const { userId, apiKey } = await requireApiKey(request, ['posts:write'])
  await checkRateLimit(apiKey.id, apiKey.rateLimit)

  const body = await request.json()
  const { content, platform, socialAccountId, mediaUrls, scheduledAt } = body

  if (!content || (!platform && !socialAccountId)) {
    return Response.json({ error: 'Missing required fields: content, platform or socialAccountId' }, { status: 400 })
  }

  const socialAccount = socialAccountId
    ? await prisma.socialAccount.findFirst({ where: { id: socialAccountId, userId } })
    : await prisma.socialAccount.findFirst({ where: { userId, platform } })

  if (!socialAccount) {
    return Response.json({ error: 'Social account not found' }, { status: 404 })
  }

  const post = await prisma.socialPost.create({
    data: {
      content,
      platform,
      mediaUrls: mediaUrls || [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'draft',
      socialAccountId: socialAccount.id,
    },
  })

  return Response.json({ post }, { status: 201 })
}
