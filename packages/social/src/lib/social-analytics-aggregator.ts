// Cross-platform analytics aggregation with per-platform engagement rate formulas
// Read-only: reads from cache/DB, no API calls

import { prisma } from '@creator-studio/db/client'
import { cacheGet } from '@creator-studio/redis/cache'
import type { SocialPlatform, PostAnalyticsData, AnalyticsSnapshot } from '../types/social-types'
import type { PlatformInsights } from './platform-interface'

// Per-platform engagement rate formulas
// Twitter/TikTok/Bluesky use impressions as denominator (no reach metric)
// Instagram/Facebook/Threads/LinkedIn use reach when available
const ENGAGEMENT_FORMULAS: Record<SocialPlatform, (i: PlatformInsights) => number> = {
  instagram: (i) => (i.likes + i.comments + i.shares + i.saves) / Math.max(i.reach, 1) * 100,
  facebook:  (i) => (i.likes + i.comments + i.shares) / Math.max(i.reach, 1) * 100,
  twitter:   (i) => (i.likes + i.comments + i.shares + i.saves) / Math.max(i.impressions, 1) * 100,
  tiktok:    (i) => (i.likes + i.comments + i.shares) / Math.max(i.impressions, 1) * 100,
  linkedin:  (i) => (i.likes + i.comments + i.shares) / Math.max(i.impressions || i.reach, 1) * 100,
  threads:   (i) => (i.likes + i.comments + i.shares) / Math.max(i.reach, 1) * 100,
  bluesky:   (i) => (i.likes + i.comments + i.shares) / Math.max(i.impressions || 1, 1) * 100,
}

export function calculateEngagementRate(platform: SocialPlatform, insights: PlatformInsights): number {
  const formula = ENGAGEMENT_FORMULAS[platform]
  return Math.round(formula(insights) * 100) / 100
}

// Try cache first, then DB
export async function getPostAnalytics(postId: string): Promise<PostAnalyticsData | null> {
  const today = new Date().toISOString().slice(0, 10)
  const cacheKey = `social:analytics:${postId}:${today}`

  const cached = await cacheGet<PostAnalyticsData>(cacheKey)
  if (cached) return cached

  const analytics = await prisma.postAnalytics.findUnique({ where: { postId } })
  if (!analytics) return null

  return {
    ...analytics,
    engagementRate: Number(analytics.engagementRate),
    snapshots: (analytics.snapshots ?? []) as unknown as AnalyticsSnapshot[],
  }
}

interface AggregatedStats {
  totalPosts: number
  totalImpressions: number
  totalReach: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalSaves: number
  averageEngagementRate: number
}

export async function getAccountAnalytics(socialAccountId: string): Promise<AggregatedStats> {
  const posts = await prisma.socialPost.findMany({
    where: { socialAccountId, status: 'published' },
    include: { analytics: true },
  })

  if (posts.length === 0) {
    return emptyStats()
  }

  const aggregated = posts.reduce(
    (acc, post) => {
      if (!post.analytics) return acc
      return {
        totalImpressions: acc.totalImpressions + post.analytics.impressions,
        totalReach: acc.totalReach + post.analytics.reach,
        totalLikes: acc.totalLikes + post.analytics.likes,
        totalComments: acc.totalComments + post.analytics.comments,
        totalShares: acc.totalShares + post.analytics.shares,
        totalSaves: acc.totalSaves + post.analytics.saves,
        totalEngagement: acc.totalEngagement + Number(post.analytics.engagementRate),
      }
    },
    { totalImpressions: 0, totalReach: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalSaves: 0, totalEngagement: 0 }
  )

  return {
    totalPosts: posts.length,
    ...aggregated,
    averageEngagementRate: aggregated.totalEngagement / posts.length,
  }
}

export async function getUserAnalytics(userId: string): Promise<{
  accountAnalytics: Array<{
    socialAccountId: string
    platform: string
    username: string
    stats: AggregatedStats
  }>
  totalStats: AggregatedStats
}> {
  const accounts = await prisma.socialAccount.findMany({ where: { userId } })

  const accountAnalytics = await Promise.all(
    accounts.map(async (account) => ({
      socialAccountId: account.id,
      platform: account.platform,
      username: account.username,
      stats: await getAccountAnalytics(account.id),
    }))
  )

  const totalStats = accountAnalytics.reduce(
    (acc, { stats }) => ({
      totalPosts: acc.totalPosts + stats.totalPosts,
      totalImpressions: acc.totalImpressions + stats.totalImpressions,
      totalReach: acc.totalReach + stats.totalReach,
      totalLikes: acc.totalLikes + stats.totalLikes,
      totalComments: acc.totalComments + stats.totalComments,
      totalShares: acc.totalShares + stats.totalShares,
      totalSaves: acc.totalSaves + stats.totalSaves,
      averageEngagementRate: acc.averageEngagementRate + stats.averageEngagementRate,
    }),
    emptyStats()
  )

  if (accountAnalytics.length > 0) {
    totalStats.averageEngagementRate /= accountAnalytics.length
  }

  return { accountAnalytics, totalStats }
}

function emptyStats(): AggregatedStats {
  return {
    totalPosts: 0,
    totalImpressions: 0,
    totalReach: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalSaves: 0,
    averageEngagementRate: 0,
  }
}
