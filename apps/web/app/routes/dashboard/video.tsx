import { useState, useEffect, lazy, Suspense } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { EditorToolbar } from '~/components/editor/editor-toolbar'
import { EditorSkeleton } from '~/components/editor/editor-skeleton'

const VideoEditorLazy = lazy(() =>
  import('@creator-studio/video/components/video-editor').then((mod) => ({
    default: mod.VideoEditor,
  })),
)

export default function Video() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <EditorSkeleton />
  }

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar title="Video Editor">
        <Button variant="ghost" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </EditorToolbar>
      <div className="flex-1 min-h-0">
        <Suspense fallback={<EditorSkeleton />}>
          <VideoEditorLazy />
        </Suspense>
      </div>
    </div>
  )
}
