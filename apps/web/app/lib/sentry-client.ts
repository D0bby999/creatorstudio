import * as Sentry from '@sentry/react'

let initialized = false

export function initSentry() {
  if (initialized) return
  initialized = true

  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['Authorization']
          delete event.request.headers['Cookie']
        }
        delete event.request.data
        delete event.request.cookies
      }
      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
      }
      return event
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
        delete breadcrumb.data?.requestBody
        delete breadcrumb.data?.responseBody
      }
      return breadcrumb
    },
  })
}

export function captureError(error: unknown) {
  if (!import.meta.env.VITE_SENTRY_DSN) return
  Sentry.captureException(error)
}
