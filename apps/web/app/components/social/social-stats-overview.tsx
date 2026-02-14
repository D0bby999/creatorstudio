import { TrendingUp, Calendar } from 'lucide-react'
import { StatCard } from '@creator-studio/ui/components/composites/stat-card'
import { formatNumber } from '~/lib/format-utils'

interface SocialStatsOverviewProps {
  stats: {
    totalPosts: number
    totalImpressions: number
    totalEngagement: number
    scheduledPosts: number
  }
}

export function SocialStatsOverview({ stats }: SocialStatsOverviewProps) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Posts"
        value={stats.totalPosts}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Impressions"
        value={formatNumber(stats.totalImpressions)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Engagement"
        value={formatNumber(stats.totalEngagement)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Scheduled"
        value={stats.scheduledPosts}
        icon={<Calendar className="h-4 w-4" />}
      />
    </div>
  )
}
