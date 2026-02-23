import { useState, useEffect, lazy, Suspense } from 'react'
import { Download, Save, Keyboard } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { EditorToolbar } from '~/components/editor/editor-toolbar'
import { EditorSkeleton } from '~/components/editor/editor-skeleton'
import { KeyboardShortcutsDialog } from '~/components/editor/keyboard-shortcuts-dialog'

const CanvasEditorLazy = lazy(() =>
  import('@creator-studio/canvas/components/canvas-editor').then((mod) => ({
    default: mod.CanvasEditor,
  })),
)

export default function Canvas() {
  const [isClient, setIsClient] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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
          />
        </Suspense>
      </div>
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
