import { useState, useEffect, lazy, Suspense } from 'react'

const VideoEditorLazy = lazy(() =>
  import('@creator-studio/video/components/video-editor').then((mod) => ({
    default: mod.VideoEditor,
  })),
)

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Loading Video Editor...</h1>
      </div>
    </div>
  )
}

export default function Video() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <Loading />
  }

  return (
    <Suspense fallback={<Loading />}>
      <VideoEditorLazy />
    </Suspense>
  )
}
