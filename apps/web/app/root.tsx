import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from 'react-router'
import { Analytics } from '@vercel/analytics/react'
import { useEffect } from 'react'
import type { Route } from './+types/root'
import { initSentry, captureError } from './lib/sentry-client'
import { ThemeProvider } from '@creator-studio/ui/lib/theme-provider'
import { themeScript } from '@creator-studio/ui/lib/theme-script'
import './app.css'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSentry()
  }, [])

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Analytics />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  useEffect(() => {
    captureError(error)
  }, [error])

  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="flex h-full items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{message}</h1>
        <p className="mt-2 text-muted-foreground">{details}</p>
        {stack && (
          <pre className="mt-4 w-full max-w-2xl overflow-x-auto rounded-lg bg-muted p-4 text-left text-sm">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  )
}
