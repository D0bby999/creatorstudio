import { prisma } from '../client'

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
 * Find all social accounts for a user
 */
export async function findSocialAccountsByUserId(userId: string) {
  return prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
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
 * Find posts that are due to be published
 */
export async function findDuePosts() {
  return prisma.socialPost.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: {
        lte: new Date(),
      },
    },
    include: {
      socialAccount: true,
    },
  })
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
