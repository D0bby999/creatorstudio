import { useState, useEffect, lazy, Suspense } from 'react'

/**
 * Canvas editor route — client-only rendering.
 * Tldraw relies on browser APIs (canvas, pointer events) and cannot SSR.
 * We dynamically import the CanvasEditor component on the client.
 */

const CanvasEditorLazy = lazy(() =>
  import('@creator-studio/canvas/components/canvas-editor').then((mod) => ({
    default: mod.CanvasEditor,
  })),
)

export default function Canvas() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Loading canvas editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto" />
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Loading canvas editor...</p>
            </div>
          </div>
        }
      >
        <CanvasEditorLazy />
      </Suspense>
    </div>
  )
}
