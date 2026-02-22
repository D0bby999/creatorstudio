import { inngest } from '../inngest-client'
import { prisma } from '@creator-studio/db/client'

export const hardDeleteUsersCron = inngest.createFunction(
  { id: 'hard-delete-users-cron', name: 'Hard Delete Users Cron' },
  { cron: '0 0 * * *' },
  async ({ step }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const usersToDelete = await step.run('find-expired-users', async () => {
      return prisma.user.findMany({
        where: { deletedAt: { lte: thirtyDaysAgo } },
        select: { id: true, email: true },
      })
    })

    if (usersToDelete.length === 0) {
      return { deletedCount: 0 }
    }

    let deletedCount = 0
    for (const user of usersToDelete) {
      await step.run(`delete-user-${user.id}`, async () => {
        await prisma.user.delete({ where: { id: user.id } })
        return { deleted: user.email }
      })
      deletedCount++
    }

    return { deletedCount }
  },
)
