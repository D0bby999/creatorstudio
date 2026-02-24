import { useState, useEffect, lazy, Suspense } from 'react'
import { useLoaderData, useSearchParams } from 'react-router'
import { Download, Save, Keyboard } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { EditorToolbar } from '~/components/editor/editor-toolbar'
import { EditorSkeleton } from '~/components/editor/editor-skeleton'
import { KeyboardShortcutsDialog } from '~/components/editor/keyboard-shortcuts-dialog'
import { auth } from '~/lib/auth-server'

const CanvasEditorLazy = lazy(() =>
  import('@creator-studio/canvas/components/canvas-editor').then((mod) => ({
    default: mod.CanvasEditor,
  })),
)

export async function loader({ request }: { request: Request }) {
  const session = await auth.api.getSession({ headers: request.headers })
  const wsPort = process.env.CANVAS_WS_PORT ?? '5174'

  return Response.json({
    userId: session?.user?.id ?? null,
    userName: session?.user?.name ?? null,
    sessionToken: session?.session?.token ?? null,
    wsPort,
  })
}

export default function Canvas() {
  const { userId, userName, sessionToken, wsPort } = useLoaderData<typeof loader>() as {
    userId: string | null
    userName: string | null
    sessionToken: string | null
    wsPort: string
  }
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('room')

  const [isClient, setIsClient] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [wsUrl, setWsUrl] = useState<string | undefined>()

  useEffect(() => {
    setIsClient(true)
    // Construct WS URL from current window location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    setWsUrl(`${protocol}//${window.location.hostname}:${wsPort}/api/canvas/sync`)
  }, [wsPort])

  if (!isClient) {
    return <EditorSkeleton />
  }

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar title="Canvas Editor">
        <Button variant="ghost" size="sm">
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
      </EditorToolbar>
      <div className="flex-1 min-h-0">
        <Suspense fallback={<EditorSkeleton />}>
          <CanvasEditorLazy
            uploadEndpoint="/api/canvas/upload"
            assetsEndpoint="/api/canvas/assets"
            aiGenerateEndpoint="/api/canvas/ai-generate"
            aiFillEndpoint="/api/canvas/ai-fill"
            aiVideoGenEndpoint="/api/canvas/ai-video-gen"
            aiVideoStatusEndpoint="/api/canvas/ai-video-status"
            aiDesignGenEndpoint="/api/canvas/ai-design-gen"
            roomId={roomId ?? undefined}
            wsUrl={wsUrl}
            authToken={sessionToken ?? undefined}
            userId={userId ?? undefined}
            userName={userName ?? 'Anonymous'}
          />
        </Suspense>
      </div>
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
