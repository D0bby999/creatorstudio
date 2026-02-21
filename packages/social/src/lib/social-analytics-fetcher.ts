// Multi-platform analytics fetcher with Redis caching (1h TTL)
// Factory-based: works for all 7 platforms, not just Instagram

import { prisma } from '@creator-studio/db/client'
import { cacheGet, cacheSet } from '@creator-studio/redis/cache'
import { getPlatformClient } from './platform-factory'
import type { SocialPlatform, PostAnalyticsData, AnalyticsSnapshot } from '../types/social-types'
import type { PlatformInsights } from './platform-interface'
import { calculateEngagementRate } from './social-analytics-aggregator'

const CACHE_TTL_SECONDS = 3600 // 1 hour
const MAX_SNAPSHOTS = 90

function buildCacheKey(postId: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `social:analytics:${postId}:${today}`
}

export async function fetchPostAnalytics(
  postId: string,
  forceRefresh = false
): Promise<PostAnalyticsData> {
  const cacheKey = buildCacheKey(postId)

  // Check cache unless forced refresh
  if (!forceRefresh) {
    const cached = await cacheGet<PostAnalyticsData>(cacheKey)
    if (cached) return cached
  }

  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { socialAccount: true },
  })

  if (!post) throw new Error(`Post not found: ${postId}`)
  if (post.status !== 'published' || !post.platformPostId) {
    throw new Error(`Post must be published to fetch analytics: ${postId}`)
  }

  const metadata = post.socialAccount.metadata as Record<string, string> | null
  const client = getPlatformClient(
    post.platform as SocialPlatform,
    post.socialAccount.accessToken,
    metadata ? {
      handle: metadata.handle,
      appPassword: metadata.appPassword,
      pageId: metadata.pageId,
      pageAccessToken: metadata.pageAccessToken,
      openId: metadata.openId,
    } : undefined
  )

  const insights = await client.getPostInsights(post.platformPostId)
  const engagementRate = calculateEngagementRate(post.platform as SocialPlatform, insights)

  // Build snapshot entry
  const snapshot: AnalyticsSnapshot = {
    date: new Date().toISOString().slice(0, 10),
    impressions: insights.impressions,
    reach: insights.reach,
    likes: insights.likes,
    comments: insights.comments,
    shares: insights.shares,
    saves: insights.saves,
  }

  // Upsert analytics with snapshot append
  const existing = await prisma.postAnalytics.findUnique({ where: { postId } })
  const existingSnapshots = (existing?.snapshots ?? []) as unknown as AnalyticsSnapshot[]
  const newSnapshots = [...existingSnapshots, snapshot].slice(-MAX_SNAPSHOTS)

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
      snapshots: newSnapshots as unknown as any[],
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
      snapshots: newSnapshots as unknown as any[],
      fetchedAt: new Date(),
    },
  })

  const result: PostAnalyticsData = {
    ...analytics,
    engagementRate: Number(analytics.engagementRate),
    snapshots: newSnapshots,
  }

  await cacheSet(cacheKey, result, CACHE_TTL_SECONDS)

  return result
}

// Concurrency-limited batch fetch
export async function batchFetchAnalytics(
  postIds: string[],
  concurrency = 3
): Promise<{
  succeeded: string[]
  failed: Array<{ postId: string; error: string }>
}> {
  const succeeded: string[] = []
  const failed: Array<{ postId: string; error: string }> = []

  for (let i = 0; i < postIds.length; i += concurrency) {
    const chunk = postIds.slice(i, i + concurrency)
    const results = await Promise.allSettled(
      chunk.map((id) => fetchPostAnalytics(id))
    )

    results.forEach((result, index) => {
      const id = chunk[index]
      if (result.status === 'fulfilled') {
        succeeded.push(id)
      } else {
        failed.push({ postId: id, error: result.reason?.message ?? 'Unknown error' })
      }
    })
  }

  return { succeeded, failed }
}
