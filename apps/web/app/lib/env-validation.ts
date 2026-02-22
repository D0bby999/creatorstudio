const requiredEnvVars = [
  'DATABASE_URL',
  'BETTER_AUTH_URL',
  'BETTER_AUTH_SECRET',
] as const

const optionalEnvVars = [
  'RESEND_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GITHUB_CLIENT_ID',
  'OPENAI_API_KEY',
  'REDIS_URL',
  'UPSTASH_REDIS_REST_URL',
  'TOKEN_ENCRYPTION_KEY',
  'INNGEST_EVENT_KEY',
] as const

export function validateEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === 'true') return

  const missing: string[] = []

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    console.error('[env] Missing required environment variables:')
    missing.forEach((v) => console.error(`  - ${v}`))
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }

  const missingOptional: string[] = []
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      missingOptional.push(varName)
    }
  }

  if (missingOptional.length > 0) {
    console.warn('[env] Missing optional environment variables (features may be limited):')
    missingOptional.forEach((v) => console.warn(`  - ${v}`))
  }
}
