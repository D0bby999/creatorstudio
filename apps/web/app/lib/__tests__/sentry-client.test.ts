import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}))

describe('sentry-client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('does not init sentry when DSN is missing', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    const Sentry = await import('@sentry/react')
    const { initSentry } = await import('../sentry-client')
    initSentry()
    expect(Sentry.init).not.toHaveBeenCalled()
  })

  it('captureError no-ops when DSN missing', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    const Sentry = await import('@sentry/react')
    const { captureError } = await import('../sentry-client')
    captureError(new Error('test'))
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })
})
