import { prisma } from '../client'
import { paginationArgs, type PaginationParams } from '../helpers/pagination'

/**
 * Create social account
 */
export async function createSocialAccount(data: {
  platform: string
  platformUserId: string
  username: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  userId: string
}) {
  return prisma.socialAccount.create({
    data,
  })
}

/**
 * Find all social accounts for a user (paginated)
 */
export async function findSocialAccountsByUserId(userId: string, pagination?: PaginationParams) {
  const where = { userId }

  if (pagination) {
    const p = paginationArgs(pagination)
    const [items, total] = await Promise.all([
      prisma.socialAccount.findMany({ where, orderBy: { createdAt: 'desc' }, take: p.take, skip: p.skip }),
      prisma.socialAccount.count({ where }),
    ])
    return p.toResponse(items, total)
  }

  return prisma.socialAccount.findMany({ where, orderBy: { createdAt: 'desc' } })
}

/**
 * Create social post
 */
export async function createSocialPost(data: {
  content: string
  mediaUrls: string[]
  platform: string
  scheduledAt?: Date
  status: string
  socialAccountId: string
}) {
  return prisma.socialPost.create({
    data,
  })
}

/**
 * Find posts that are due to be published (paginated)
 */
export async function findDuePosts(pagination?: PaginationParams) {
  const where = { status: 'scheduled', scheduledAt: { lte: new Date() } }

  if (pagination) {
    const p = paginationArgs(pagination)
    const [items, total] = await Promise.all([
      prisma.socialPost.findMany({ where, include: { socialAccount: true }, take: p.take, skip: p.skip }),
      prisma.socialPost.count({ where }),
    ])
    return p.toResponse(items, total)
  }

  return prisma.socialPost.findMany({ where, include: { socialAccount: true } })
}

/**
 * Update post status after publishing attempt
 */
export async function updatePostStatus(
  id: string,
  status: string,
  platformPostId?: string
) {
  return prisma.socialPost.update({
    where: { id },
    data: {
      status,
      platformPostId,
      publishedAt: status === 'published' ? new Date() : undefined,
    },
  })
}
