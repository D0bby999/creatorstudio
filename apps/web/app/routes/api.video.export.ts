/**
 * Video Export API Route
 *
 * POST /api/video/export - Request server-side video render via Remotion Lambda
 * Triggers Inngest background job for async rendering
 */

import type { Route } from './+types/api.video.export'
import { auth } from '@creator-studio/auth'
import { prisma } from '@creator-studio/db'
import { inngest } from '~/lib/inngest/inngest-client'

export async function action({ request }: Route.ActionArgs) {
  // Auth check
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { projectId, format = 'mp4', inputProps = {} } = body

    // Validate format
    if (!['mp4', 'webm'].includes(format)) {
      return Response.json(
        { error: 'Invalid format. Must be mp4 or webm' },
        { status: 400 }
      )
    }

    // Validate projectId exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, type: true },
    })

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create VideoExport record
    const videoExport = await prisma.videoExport.create({
      data: {
        projectId,
        userId: session.user.id,
        format,
        status: 'queued',
        progress: 0,
      },
    })

    // Send Inngest event to trigger background export
    await inngest.send({
      name: 'video/export.requested',
      data: {
        exportId: videoExport.id,
        projectId,
        userId: session.user.id,
        format,
        inputProps,
      },
    })

    return Response.json({
      exportId: videoExport.id,
      status: 'queued',
      message: 'Video export queued. Check status via /api/video/export-status',
    })
  } catch (error) {
    console.error('[Video Export API] Error:', error)
    return Response.json(
      {
        error: 'Failed to queue video export',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
