/**
 * Remotion Lambda Configuration
 *
 * Provides configuration for server-side video rendering via Remotion Lambda.
 * Gracefully handles missing environment variables.
 */

export interface RemotionLambdaConfig {
  region: string
  functionName: string
  serveUrl: string
}

/**
 * Get Remotion Lambda configuration from environment variables
 * Returns null if not configured (allows graceful degradation)
 */
export function getRemotionLambdaConfig(): RemotionLambdaConfig | null {
  const region = process.env.REMOTION_REGION
  const functionName = process.env.REMOTION_FUNCTION_NAME
  const serveUrl = process.env.REMOTION_SERVE_URL

  // Check if all required env vars are present
  if (!region || !functionName || !serveUrl) {
    console.warn(
      '[Remotion Lambda] Configuration incomplete. Required env vars:',
      'REMOTION_REGION, REMOTION_FUNCTION_NAME, REMOTION_SERVE_URL'
    )
    return null
  }

  return {
    region,
    functionName,
    serveUrl,
  }
}

/**
 * Check if Remotion Lambda is configured and available
 */
export function isRemotionLambdaAvailable(): boolean {
  return getRemotionLambdaConfig() !== null
}
