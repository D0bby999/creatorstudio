import { prisma } from '../client'

/**
 * Create crawl job
 */
export async function createCrawlJob(data: {
  url: string
  type: string
  userId: string
  priority?: number
}) {
  return prisma.crawlJob.create({
    data: {
      url: data.url,
      type: data.type,
      userId: data.userId,
      priority: data.priority ?? 0,
    },
  })
}

/**
 * Find crawl job by ID
 */
export async function findCrawlJobById(id: string) {
  return prisma.crawlJob.findUnique({
    where: { id },
  })
}

/**
 * Find crawl jobs by status
 */
export async function findCrawlJobsByStatus(status: string) {
  return prisma.crawlJob.findMany({
    where: { status },
    orderBy: { priority: 'desc' },
  })
}

/**
 * Update crawl job status and results
 */
export async function updateCrawlJobStatus(
  id: string,
  status: string,
  result?: any,
  error?: string
) {
  return prisma.crawlJob.update({
    where: { id },
    data: {
      status,
      result,
      error,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
    },
  })
}

/**
 * Find all crawl jobs for a user
 */
export async function findCrawlJobsByUserId(userId: string) {
  return prisma.crawlJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}
