import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import { PageHeader } from '@creator-studio/ui/components/composites/page-header'
import { SocialStatsOverview } from '~/components/social/social-stats-overview'
import { SocialAccountsList } from '~/components/social/social-accounts-list'
import { SocialPostsTable } from '~/components/social/social-posts-table'
import type { Route } from './+types/social'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const recentPosts = await prisma.socialPost.findMany({
    where: { socialAccount: { userId: session.user.id } },
    include: {
      socialAccount: { select: { platform: true, username: true } },
      analytics: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const publishedPosts = recentPosts.filter((p) => p.status === 'published')
  const totalImpressions = publishedPosts.reduce((sum, p) => sum + (p.analytics?.impressions || 0), 0)
  const totalEngagement = publishedPosts.reduce(
    (sum, p) => sum + (p.analytics?.likes || 0) + (p.analytics?.comments || 0) + (p.analytics?.shares || 0),
    0,
  )

  return {
    user: session.user,
    socialAccounts,
    recentPosts,
    stats: {
      totalPosts: publishedPosts.length,
      totalImpressions,
      totalEngagement,
      scheduledPosts: recentPosts.filter((p) => p.status === 'scheduled').length,
    },
  }
}

export default function Social({ loaderData }: Route.ComponentProps) {
  const { socialAccounts, recentPosts, stats } = loaderData

  return (
    <div className="p-6">
      <PageHeader
        title="Social Management"
        description="Manage your social media accounts and schedule posts"
        className="mb-6"
      />
      <SocialStatsOverview stats={stats} />
      <SocialAccountsList accounts={socialAccounts} />
      <SocialPostsTable posts={recentPosts} accounts={socialAccounts} />
    </div>
  )
}
