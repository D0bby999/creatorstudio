import { prisma } from '../client'

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
 * Find all projects for a user
 */
export async function findProjectsByUserId(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
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
