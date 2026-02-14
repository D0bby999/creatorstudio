import type { LoaderFunctionArgs } from 'react-router'
import { db } from '@creator-studio/db'
import { getRedis, isRedisAvailable } from '@creator-studio/redis'

export async function loader({ request }: LoaderFunctionArgs) {
  const startTime = Date.now()
  const checks: Record<string, boolean> = {}

  // Check database connectivity
  try {
    await db.$queryRaw`SELECT 1`
    checks.db = true
  } catch (error) {
    checks.db = false
  }

  // Check Redis connectivity
  try {
    const redisClient = getRedis()
    if (redisClient) {
      await redisClient.ping()
      checks.redis = true
    } else {
      // Redis not configured (in-memory fallback mode)
      checks.redis = !isRedisAvailable()
    }
  } catch (error) {
    checks.redis = false
  }

  const responseTime = Date.now() - startTime
  const isHealthy = checks.db && checks.redis

  return Response.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.0',
      checks,
      responseTime,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}
