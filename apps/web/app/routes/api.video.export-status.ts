/**
 * Video Export Status API Route
 *
 * GET /api/video/export-status?exportId=xxx - Check video export progress
 * Returns cached progress from Redis or database fallback
 */

import type { Route } from './+types/api.video.export-status'
import { auth } from '@creator-studio/auth'
import { prisma } from '@creator-studio/db'
import { cacheGet } from '@creator-studio/redis'
import { logger } from '~/lib/logger'

export async function loader({ request }: Route.LoaderArgs) {
  // Auth check
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const exportId = url.searchParams.get('exportId')

    if (!exportId) {
      return Response.json(
        { error: 'Missing exportId query parameter' },
        { status: 400 }
      )
    }

    // Try Redis cache first for real-time progress
    const cachedProgress = await cacheGet(`video:export:${exportId}`)
    if (cachedProgress) {
      const progress = JSON.parse(cachedProgress)
      return Response.json(progress)
    }

    // Fallback to database
    const videoExport = await prisma.videoExport.findUnique({
      where: { id: exportId },
      select: {
        id: true,
        status: true,
        progress: true,
        outputUrl: true,
        error: true,
        userId: true,
        createdAt: true,
        completedAt: true,
      },
    })

    if (!videoExport) {
      return Response.json({ error: 'Export not found' }, { status: 404 })
    }

    // Check authorization
    if (videoExport.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({
      exportId: videoExport.id,
      status: videoExport.status,
      progress: videoExport.progress,
      outputUrl: videoExport.outputUrl,
      error: videoExport.error,
      createdAt: videoExport.createdAt,
      completedAt: videoExport.completedAt,
    })
  } catch (error) {
    logger.error({ err: error }, '[Video Export Status API] Error')
    return Response.json(
      {
        error: 'Failed to get export status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
