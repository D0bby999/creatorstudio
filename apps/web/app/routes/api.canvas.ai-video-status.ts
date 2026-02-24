/**
 * GET /api/canvas/ai-video-status?jobId=xxx
 * Polls video generation job status from Redis
 */

import { auth } from '~/lib/auth-server'
import { cacheGet } from '@creator-studio/redis'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function loader({ request }: { request: Request }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const jobId = url.searchParams.get('jobId')

  if (!jobId || !UUID_REGEX.test(jobId)) {
    return Response.json({ error: 'Invalid jobId' }, { status: 400 })
  }

  const statusKey = `canvas:video:${session.user.id}:${jobId}`
  const raw = await cacheGet<string>(statusKey)

  if (!raw) {
    return Response.json({ status: 'pending' })
  }

  try {
    const data = JSON.parse(raw)
    return Response.json({
      status: data.status ?? 'pending',
      videoUrl: data.videoUrl ?? undefined,
      error: data.error ?? undefined,
    })
  } catch {
    return Response.json({ status: 'pending' })
  }
}
