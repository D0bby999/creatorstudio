/**
 * Inngest function for video export orchestration
 * Triggers Remotion Lambda render, polls progress, and stores result in R2
 */

import { inngest } from '../inngest-client'
import { prisma } from '@creator-studio/db'
import { cacheSet } from '@creator-studio/redis'
import {
  startExport,
  getExportProgress,
  copyToR2,
  cleanupLambdaFiles,
} from '@creator-studio/video/lib/video-export-service'
import { isRemotionLambdaAvailable } from '@creator-studio/video/lib/remotion-lambda-config'

interface VideoExportRequestedEvent {
  data: {
    exportId: string
    projectId: string
    userId: string
    format: 'mp4' | 'webm'
    inputProps?: Record<string, unknown>
  }
}

/**
 * Video export orchestration function
 * Handles full lifecycle: render → poll → copy to R2 → cleanup
 */
export const videoExportTrigger = inngest.createFunction(
  {
    id: 'trigger-video-export',
    name: 'Trigger Video Export',
    retries: 2,
  },
  { event: 'video/export.requested' },
  async ({ event, step }) => {
    const { exportId, projectId, userId, format, inputProps = {} } =
      event.data as VideoExportRequestedEvent['data']

    // Step 1: Load export record and validate
    const exportRecord = await step.run('load-export-record', async () => {
      const record = await prisma.videoExport.findUnique({
        where: { id: exportId },
      })

      if (!record) {
        throw new Error(`Export record not found: ${exportId}`)
      }

      return record
    })

    // Step 2: Check Remotion Lambda availability
    const isAvailable = await step.run('check-lambda-availability', async () => {
      if (!isRemotionLambdaAvailable()) {
        await prisma.videoExport.update({
          where: { id: exportId },
          data: {
            status: 'failed',
            error: 'Remotion Lambda not configured. Set REMOTION_REGION, REMOTION_FUNCTION_NAME, REMOTION_SERVE_URL',
          },
        })
        throw new Error('Remotion Lambda not configured')
      }
      return true
    })

    // Step 3: Start Remotion Lambda render
    const renderInfo = await step.run('start-remotion-render', async () => {
      try {
        const result = await startExport(exportId, {
          projectId,
          userId,
          format,
          inputProps,
        })

        // Update DB with renderId
        await prisma.videoExport.update({
          where: { id: exportId },
          data: {
            status: 'rendering',
            renderId: result.renderId,
          },
        })

        return result
      } catch (error) {
        await prisma.videoExport.update({
          where: { id: exportId },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Failed to start render',
          },
        })
        throw error
      }
    })

    // Step 4: Poll render progress (every 5 seconds until complete)
    // Using step.run() per iteration to avoid serverless timeout
    const maxAttempts = 360 // 30 minutes max (5s * 360 = 1800s)
    let renderResult: { completed: boolean; bucketName: string; s3Key: string } | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const progress = await step.run(`check-render-status-${attempt}`, async () => {
        const config = isRemotionLambdaAvailable()
        if (!config) throw new Error('Lambda not configured')

        const progressData = await getExportProgress(
          exportId,
          renderInfo.renderId,
          process.env.REMOTION_REGION || 'us-east-1',
          renderInfo.bucketName
        )

        // Update database progress
        await prisma.videoExport.update({
          where: { id: exportId },
          data: {
            progress: progressData.progress * 100,
          },
        })

        return progressData
      })

      if (progress.status === 'completed') {
        renderResult = {
          completed: true,
          bucketName: renderInfo.bucketName,
          s3Key: `renders/${renderInfo.renderId}/out.${format}`,
        }
        break
      }

      // Wait 5 seconds before next poll (unless this is the last attempt)
      if (attempt < maxAttempts - 1) {
        await step.sleep('wait-before-next-poll', '5s')
      }
    }

    if (!renderResult) {
      throw new Error('Render timeout after 30 minutes')
    }

    // Step 5: Copy rendered video to R2
    const r2Url = await step.run('copy-to-r2', async () => {
      try {
        await prisma.videoExport.update({
          where: { id: exportId },
          data: { status: 'copying', progress: 95 },
        })

        const url = await copyToR2(
          renderResult.bucketName,
          renderResult.s3Key,
          userId,
          format
        )

        return url
      } catch (error) {
        await prisma.videoExport.update({
          where: { id: exportId },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Failed to copy to R2',
          },
        })
        throw error
      }
    })

    // Step 6: Update database with final result
    await step.run('update-export-record', async () => {
      await prisma.videoExport.update({
        where: { id: exportId },
        data: {
          status: 'completed',
          progress: 100,
          outputUrl: r2Url,
          completedAt: new Date(),
        },
      })

      // Update Redis cache
      await cacheSet(
        `video:export:${exportId}`,
        JSON.stringify({
          exportId,
          status: 'completed',
          progress: 100,
          outputUrl: r2Url,
        }),
        3600
      )
    })

    // Step 7: Cleanup Lambda files (best effort)
    await step.run('cleanup-lambda-files', async () => {
      try {
        await cleanupLambdaFiles(renderResult.bucketName, renderInfo.renderId)
      } catch (error) {
        // Non-critical - log but don't fail
        console.warn('[Video Export] Cleanup warning:', error)
      }
    })

    // Step 8: Send completion event
    await step.sendEvent('send-completion-event', {
      name: 'video/export.completed',
      data: {
        exportId,
        projectId,
        userId,
        status: 'completed',
        outputUrl: r2Url,
      },
    })

    return {
      exportId,
      status: 'completed',
      outputUrl: r2Url,
    }
  }
)
