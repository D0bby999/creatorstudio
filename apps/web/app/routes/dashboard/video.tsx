import { useState, useEffect, lazy, Suspense } from 'react'
import { Download, Save, Keyboard } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { EditorToolbar } from '~/components/editor/editor-toolbar'
import { EditorSkeleton } from '~/components/editor/editor-skeleton'
import { KeyboardShortcutsDialog } from '~/components/editor/keyboard-shortcuts-dialog'

const VideoEditorLazy = lazy(() =>
  import('@creator-studio/video/components/video-editor').then((mod) => ({
    default: mod.VideoEditor,
  })),
)

export default function Video() {
  const [isClient, setIsClient] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShortcutsOpen(true)
      }
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        console.log('Save triggered')
      }
      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        console.log('Export triggered')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isClient) {
    return <EditorSkeleton />
  }

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar title="Video Editor">
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
          <VideoEditorLazy />
        </Suspense>
      </div>
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
