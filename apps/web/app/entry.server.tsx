import type { RenderToPipeableStreamOptions, AppLoadContext, EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { renderToPipeableStream } from 'react-dom/server'
import { isbot } from 'isbot'
import * as Sentry from '@sentry/react'
import { PassThrough } from 'node:stream'
import { generateSecurityHeaders } from './lib/security-headers'
import { logger } from './lib/logger'
import { validateEnv } from './lib/env-validation'

const ABORT_DELAY = 5_000

validateEnv()

// Note: @sentry/react v8+ works for both client and server in React Router apps
// It auto-detects the Node.js runtime and configures appropriately for SSR
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  })
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  const nonce = crypto.randomUUID()

  const securityHeaders = generateSecurityHeaders(nonce)
  for (const [key, value] of securityHeaders.entries()) {
    responseHeaders.set(key, value)
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false
    const userAgent = request.headers.get('user-agent')
    const readyOption: keyof RenderToPipeableStreamOptions =
      userAgent && isbot(userAgent) ? 'onAllReady' : 'onShellReady'

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} nonce={nonce} />,
      {
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough()
          const stream = body

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream as any, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          )

          pipe(body)
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) {
            logger.error(error, 'Render error after shell')
          }
          if (process.env.SENTRY_DSN) {
            Sentry.captureException(error)
          }
        },
      }
    )

    setTimeout(abort, ABORT_DELAY)
  })
}
