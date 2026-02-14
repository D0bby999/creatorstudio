/**
 * Video Export Service
 *
 * Handles server-side video rendering via Remotion Lambda.
 * Includes progress tracking, R2 storage integration, and cleanup.
 */

import { getRemotionLambdaConfig } from './remotion-lambda-config'
import { cacheGet, cacheSet } from '@creator-studio/redis'
import { uploadFile, getPublicUrl, generateMediaPath } from '@creator-studio/storage'

// Graceful handling if @remotion/lambda is not available
let renderMediaOnLambda: any
let getRenderProgress: any

try {
  const remotionLambda = await import('@remotion/lambda')
  renderMediaOnLambda = remotionLambda.renderMediaOnLambda
  getRenderProgress = remotionLambda.getRenderProgress
} catch (error) {
  console.warn('[Video Export] @remotion/lambda not available, export will fail gracefully')
}

export interface ExportProgress {
  exportId: string
  status: 'queued' | 'rendering' | 'copying' | 'completed' | 'failed'
  progress: number
  renderId?: string
  outputUrl?: string
  error?: string
}

export interface StartExportParams {
  projectId: string
  userId: string
  format: 'mp4' | 'webm'
  inputProps: Record<string, any>
  compositionId?: string
}

/**
 * Start video export on Remotion Lambda
 * Returns renderId for progress tracking
 */
export async function startExport(
  exportId: string,
  params: StartExportParams
): Promise<{ renderId: string; bucketName: string }> {
  const config = getRemotionLambdaConfig()

  if (!config) {
    throw new Error('Remotion Lambda not configured. Set REMOTION_REGION, REMOTION_FUNCTION_NAME, REMOTION_SERVE_URL')
  }

  if (!renderMediaOnLambda) {
    throw new Error('@remotion/lambda package not installed')
  }

  const { projectId, format, inputProps, compositionId = 'VideoComposition' } = params

  try {
    // Trigger Lambda render
    const result = await renderMediaOnLambda({
      region: config.region as any,
      functionName: config.functionName,
      serveUrl: config.serveUrl,
      composition: compositionId,
      inputProps,
      codec: format === 'mp4' ? 'h264' : 'vp8',
      imageFormat: 'jpeg',
      maxRetries: 1,
      privacy: 'public',
    })

    // Cache initial progress
    await cacheSet(
      `video:export:${exportId}`,
      JSON.stringify({
        exportId,
        status: 'rendering',
        progress: 0,
        renderId: result.renderId,
      } as ExportProgress),
      3600 // 1 hour TTL
    )

    return {
      renderId: result.renderId,
      bucketName: result.bucketName,
    }
  } catch (error) {
    console.error('[Video Export] Failed to start render:', error)
    throw error
  }
}

/**
 * Get current export progress from Remotion Lambda
 * Checks Lambda status and updates Redis cache
 */
export async function getExportProgress(
  exportId: string,
  renderId: string,
  region: string,
  bucketName: string
): Promise<ExportProgress> {
  if (!getRenderProgress) {
    throw new Error('@remotion/lambda package not installed')
  }

  try {
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: getRemotionLambdaConfig()?.functionName || '',
      region: region as any,
    })

    const exportProgress: ExportProgress = {
      exportId,
      status: progress.done ? 'completed' : 'rendering',
      progress: progress.overallProgress,
      renderId,
    }

    // Cache progress update
    await cacheSet(
      `video:export:${exportId}`,
      JSON.stringify(exportProgress),
      3600
    )

    return exportProgress
  } catch (error) {
    console.error('[Video Export] Failed to get progress:', error)
    throw error
  }
}

/**
 * Download rendered video from Lambda S3 and upload to R2
 * Returns R2 public URL
 */
export async function copyToR2(
  s3Bucket: string,
  s3Key: string,
  userId: string,
  format: string
): Promise<string> {
  try {
    // Download from Lambda S3 (uses AWS SDK internally)
    // For MVP, we'll use fetch if Lambda provides public URL
    // In production, use AWS SDK to download from S3
    const config = getRemotionLambdaConfig()
    if (!config) {
      throw new Error('Remotion Lambda not configured')
    }

    // Construct Lambda S3 URL (this is a placeholder - actual implementation
    // depends on Lambda bucket configuration)
    const lambdaS3Url = `https://${s3Bucket}.s3.${config.region}.amazonaws.com/${s3Key}`

    // Download video file
    const response = await fetch(lambdaS3Url)
    if (!response.ok) {
      throw new Error(`Failed to download from Lambda S3: ${response.statusText}`)
    }

    const videoBuffer = await response.arrayBuffer()

    // Generate R2 storage path
    const r2Key = generateMediaPath(userId, 'video', `export-${Date.now()}.${format}`)

    // Upload to R2
    await uploadFile(
      r2Key,
      Buffer.from(videoBuffer),
      format === 'mp4' ? 'video/mp4' : 'video/webm'
    )

    // Get public URL
    const publicUrl = getPublicUrl(r2Key)
    if (!publicUrl) {
      throw new Error('Failed to generate R2 public URL')
    }

    return publicUrl
  } catch (error) {
    console.error('[Video Export] Failed to copy to R2:', error)
    throw error
  }
}

/**
 * Cleanup Lambda S3 files after successful copy to R2
 * Placeholder - actual implementation depends on Lambda bucket permissions
 */
export async function cleanupLambdaFiles(
  bucketName: string,
  renderId: string
): Promise<void> {
  // TODO: Implement cleanup when Lambda bucket permissions are configured
  // This requires AWS SDK S3 DeleteObject permission on the Lambda bucket
  // For now, rely on Lambda bucket lifecycle policies
  console.log(
    `[Video Export] Cleanup placeholder: bucket=${bucketName}, renderId=${renderId}`
  )
  console.log(
    '[Video Export] Configure AWS S3 lifecycle policies to auto-delete old renders'
  )
}
