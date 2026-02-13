import { prisma } from '../client'
import { paginationArgs, type PaginationParams } from '../helpers/pagination'

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
 * Find crawl jobs by status (paginated)
 */
export async function findCrawlJobsByStatus(status: string, pagination?: PaginationParams) {
  const where = { status }

  if (pagination) {
    const p = paginationArgs(pagination)
    const [items, total] = await Promise.all([
      prisma.crawlJob.findMany({ where, orderBy: { priority: 'desc' }, take: p.take, skip: p.skip }),
      prisma.crawlJob.count({ where }),
    ])
    return p.toResponse(items, total)
  }

  return prisma.crawlJob.findMany({ where, orderBy: { priority: 'desc' } })
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
 * Find all crawl jobs for a user (paginated)
 */
export async function findCrawlJobsByUserId(userId: string, pagination?: PaginationParams) {
  const where = { userId }

  if (pagination) {
    const p = paginationArgs(pagination)
    const [items, total] = await Promise.all([
      prisma.crawlJob.findMany({ where, orderBy: { createdAt: 'desc' }, take: p.take, skip: p.skip }),
      prisma.crawlJob.count({ where }),
    ])
    return p.toResponse(items, total)
  }

  return prisma.crawlJob.findMany({ where, orderBy: { createdAt: 'desc' } })
}
