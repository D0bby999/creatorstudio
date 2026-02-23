import type { ActionFunctionArgs } from 'react-router'
import { requireSession } from '~/lib/auth-server'
import { logger } from '~/lib/logger'
import {
  getSignedUploadUrl,
  generateMediaPath,
  getPublicUrl,
  UPLOAD_CONFIGS,
} from '@creator-studio/storage'

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request)

  try {
    const { filename, contentType } = await request.json()

    if (!filename || !contentType) {
      return Response.json({ error: 'Missing filename or contentType' }, { status: 400 })
    }

    const config = UPLOAD_CONFIGS['canvas-asset']
    if (!config.allowedTypes.includes(contentType)) {
      return Response.json(
        { error: `Unsupported type. Allowed: ${config.allowedTypes.join(', ')}` },
        { status: 400 },
      )
    }

    const key = generateMediaPath(session.user.id, 'canvas-asset', filename)
    const result = await getSignedUploadUrl(key, contentType, config.ttl)

    if (!result) {
      return Response.json({ error: 'R2 storage not configured' }, { status: 503 })
    }

    const publicUrl = getPublicUrl(key)

    return Response.json({
      uploadUrl: result.uploadUrl,
      publicUrl,
      key,
    })
  } catch (error) {
    logger.error({ err: error }, 'Canvas asset upload error')
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
