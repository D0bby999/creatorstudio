// Social media analytics aggregation
// Fetches and stores engagement metrics from Instagram

import { prisma } from '@creator-studio/db/client'
import { InstagramClient } from './instagram-client'
import type { PostAnalyticsData } from '../types/social-types'

/**
 * Fetch and store analytics for a published post
 */
export async function fetchPostAnalytics(postId: string): Promise<PostAnalyticsData> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: {
      socialAccount: true,
    },
  })

  if (!post) {
    throw new Error(`Post not found: ${postId}`)
  }

  if (post.status !== 'published' || !post.platformPostId) {
    throw new Error(`Post must be published to fetch analytics: ${postId}`)
  }

  let analyticsData: PostAnalyticsData

  if (post.platform === 'instagram') {
    const client = new InstagramClient(post.socialAccount.accessToken)
    const insights = await client.getPostInsights(post.platformPostId)

    // Calculate engagement rate
    const totalEngagement = insights.likes + insights.comments + insights.shares + insights.saves
    const engagementRate = insights.reach > 0 ? (totalEngagement / insights.reach) * 100 : 0

    // Upsert analytics record
    const analytics = await prisma.postAnalytics.upsert({
      where: { postId },
      create: {
        postId,
        impressions: insights.impressions,
        reach: insights.reach,
        likes: insights.likes,
        comments: insights.comments,
        shares: insights.shares,
        saves: insights.saves,
        engagementRate,
        fetchedAt: new Date(),
      },
      update: {
        impressions: insights.impressions,
        reach: insights.reach,
        likes: insights.likes,
        comments: insights.comments,
        shares: insights.shares,
        saves: insights.saves,
        engagementRate,
        fetchedAt: new Date(),
      },
    })

    analyticsData = {
      ...analytics,
      engagementRate: Number(analytics.engagementRate),
    }
  } else {
    throw new Error(`Unsupported platform: ${post.platform}`)
  }

  console.log(`Fetched analytics for post ${postId}`)
  return analyticsData
}

/**
 * Get analytics for a specific post
 */
export async function getPostAnalytics(postId: string): Promise<PostAnalyticsData | null> {
  const analytics = await prisma.postAnalytics.findUnique({
    where: { postId },
  })

  if (!analytics) {
    return null
  }

  return {
    ...analytics,
    engagementRate: Number(analytics.engagementRate),
  }
}

/**
 * Get aggregated analytics for a social account
 */
export async function getAccountAnalytics(socialAccountId: string): Promise<{
  totalPosts: number
  totalImpressions: number
  totalReach: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalSaves: number
  averageEngagementRate: number
}> {
  const posts = await prisma.socialPost.findMany({
    where: {
      socialAccountId,
      status: 'published',
    },
    include: {
      analytics: true,
    },
  })

  const totalPosts = posts.length

  if (totalPosts === 0) {
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

  const aggregated = posts.reduce(
    (acc, post) => {
      const analytics = post.analytics
      if (!analytics) return acc

      return {
        totalImpressions: acc.totalImpressions + analytics.impressions,
        totalReach: acc.totalReach + analytics.reach,
        totalLikes: acc.totalLikes + analytics.likes,
        totalComments: acc.totalComments + analytics.comments,
        totalShares: acc.totalShares + analytics.shares,
        totalSaves: acc.totalSaves + analytics.saves,
        totalEngagementRate: acc.totalEngagementRate + Number(analytics.engagementRate),
      }
    },
    {
      totalImpressions: 0,
      totalReach: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      totalEngagementRate: 0,
    }
  )

  return {
    totalPosts,
    ...aggregated,
    averageEngagementRate: aggregated.totalEngagementRate / totalPosts,
  }
}

/**
 * Get analytics for all social accounts of a user
 */
export async function getUserAnalytics(userId: string): Promise<{
  accountAnalytics: Array<{
    socialAccountId: string
    platform: string
    username: string
    stats: Awaited<ReturnType<typeof getAccountAnalytics>>
  }>
  totalStats: Awaited<ReturnType<typeof getAccountAnalytics>>
}> {
  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId },
  })

  const accountAnalytics = await Promise.all(
    socialAccounts.map(async (account) => ({
      socialAccountId: account.id,
      platform: account.platform,
      username: account.username,
      stats: await getAccountAnalytics(account.id),
    }))
  )

  // Aggregate across all accounts
  const totalStats = accountAnalytics.reduce(
    (acc, account) => ({
      totalPosts: acc.totalPosts + account.stats.totalPosts,
      totalImpressions: acc.totalImpressions + account.stats.totalImpressions,
      totalReach: acc.totalReach + account.stats.totalReach,
      totalLikes: acc.totalLikes + account.stats.totalLikes,
      totalComments: acc.totalComments + account.stats.totalComments,
      totalShares: acc.totalShares + account.stats.totalShares,
      totalSaves: acc.totalSaves + account.stats.totalSaves,
      averageEngagementRate:
        acc.averageEngagementRate + account.stats.averageEngagementRate,
    }),
    {
      totalPosts: 0,
      totalImpressions: 0,
      totalReach: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      averageEngagementRate: 0,
    }
  )

  // Calculate average engagement rate across accounts
  if (accountAnalytics.length > 0) {
    totalStats.averageEngagementRate /= accountAnalytics.length
  }

  return {
    accountAnalytics,
    totalStats,
  }
}

/**
 * Batch fetch analytics for multiple posts
 */
export async function batchFetchAnalytics(postIds: string[]): Promise<{
  succeeded: string[]
  failed: Array<{ postId: string; error: string }>
}> {
  const results = await Promise.allSettled(
    postIds.map((postId) => fetchPostAnalytics(postId))
  )

  const succeeded: string[] = []
  const failed: Array<{ postId: string; error: string }> = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      succeeded.push(postIds[index])
    } else {
      failed.push({
        postId: postIds[index],
        error: result.reason.message || 'Unknown error',
      })
    }
  })

  console.log(`Batch fetch: ${succeeded.length} succeeded, ${failed.length} failed`)

  return { succeeded, failed }
}
