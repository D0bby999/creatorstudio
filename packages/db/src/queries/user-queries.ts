import { prisma } from '../client'

/**
 * Find user by ID with sessions included
 */
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      sessions: true,
    },
  })
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

/**
 * Update user profile
 */
export async function updateUser(
  id: string,
  data: {
    name?: string
    image?: string
  }
) {
  return prisma.user.update({
    where: { id },
    data,
  })
}

/**
 * Delete user (cascades to sessions, accounts, projects, etc.)
 */
export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  })
}
