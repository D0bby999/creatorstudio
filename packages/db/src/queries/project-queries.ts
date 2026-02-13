import { prisma } from '../client'
import { paginationArgs, type PaginationParams, type PaginatedResponse } from '../helpers/pagination'

/**
 * Create new project
 */
export async function createProject(data: {
  name: string
  type: string
  userId: string
  data?: any
}) {
  return prisma.project.create({
    data: {
      name: data.name,
      type: data.type,
      userId: data.userId,
      data: data.data,
    },
  })
}

/**
 * Find project by ID
 */
export async function findProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
  })
}

/**
 * Find all projects for a user (paginated)
 */
export async function findProjectsByUserId(userId: string, pagination?: PaginationParams) {
  const where = { userId }

  if (pagination) {
    const p = paginationArgs(pagination)
    const [items, total] = await Promise.all([
      prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, take: p.take, skip: p.skip }),
      prisma.project.count({ where }),
    ])
    return p.toResponse(items, total)
  }

  return prisma.project.findMany({ where, orderBy: { createdAt: 'desc' } })
}

/**
 * Update project
 */
export async function updateProject(
  id: string,
  data: {
    name?: string
    data?: any
    thumbnail?: string
  }
) {
  return prisma.project.update({
    where: { id },
    data,
  })
}

/**
 * Delete project
 */
export async function deleteProject(id: string) {
  return prisma.project.delete({
    where: { id },
  })
}
