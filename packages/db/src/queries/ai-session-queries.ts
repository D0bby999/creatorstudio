import { prisma } from '../client'

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
 * Find all AI sessions for a user
 */
export async function findAiSessionsByUserId(userId: string) {
  return prisma.aiSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
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
