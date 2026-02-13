import { prisma } from '../client'
import { paginationArgs, type PaginationParams } from '../helpers/pagination'

/**
 * Create AI session
 */
export async function createAiSession(data: {
  userId: string
  agentRole: string
  title?: string
}) {
  return prisma.aiSession.create({
    data,
  })
}

/**
 * Find AI session by ID
 */
export async function findAiSessionById(id: string) {
  return prisma.aiSession.findUnique({
    where: { id },
  })
}

/**
 * Find all AI sessions for a user (paginated)
 */
export async function findAiSessionsByUserId(userId: string, pagination?: PaginationParams) {
  const where = { userId }

  if (pagination) {
    const p = paginationArgs(pagination)
    const [items, total] = await Promise.all([
      prisma.aiSession.findMany({ where, orderBy: { updatedAt: 'desc' }, take: p.take, skip: p.skip }),
      prisma.aiSession.count({ where }),
    ])
    return p.toResponse(items, total)
  }

  return prisma.aiSession.findMany({ where, orderBy: { updatedAt: 'desc' } })
}

/**
 * Update AI session
 */
export async function updateAiSession(
  id: string,
  data: {
    messages?: any
    tokenCount?: number
    title?: string
  }
) {
  return prisma.aiSession.update({
    where: { id },
    data,
  })
}

/**
 * Delete AI session
 */
export async function deleteAiSession(id: string) {
  return prisma.aiSession.delete({
    where: { id },
  })
}
