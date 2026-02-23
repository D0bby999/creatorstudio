import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { requireSession } from '~/lib/auth-server'
import { logger } from '~/lib/logger'
import { listFiles, deleteFile, extractUserIdFromKey } from '@creator-studio/storage'

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request)

  try {
    const prefix = `media/${session.user.id}/canvas-asset/`
    const files = await listFiles(prefix)
    return Response.json({ files })
  } catch (error) {
    logger.error({ err: error }, 'Canvas asset list error')
    return Response.json({ files: [] })
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request)

  if (request.method !== 'DELETE') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const { key } = await request.json()

    if (!key || typeof key !== 'string') {
      return Response.json({ error: 'Missing key' }, { status: 400 })
    }

    const ownerUserId = extractUserIdFromKey(key)
    if (!ownerUserId || ownerUserId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteFile(key)
    return Response.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Canvas asset delete error')
    return Response.json({ error: 'Delete failed' }, { status: 500 })
  }
}
