import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import { useState, useEffect, lazy, Suspense } from 'react'
import { prisma } from '@creator-studio/db'

const CanvasEditor = lazy(() =>
  import('@creator-studio/canvas/components/canvas-editor').then((m) => ({
    default: m.CanvasEditor,
  })),
)

interface LoaderData {
  room: {
    id: string
    name: string
    snapshot: any
  }
  permission: 'view' | 'comment' | 'edit'
  token: string
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { token } = params

  if (!token) {
    throw new Response('Token required', { status: 400 })
  }

  // Validate share link
  const shareLink = await prisma.canvasShareLink.findUnique({
    where: { token },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          snapshot: true,
        },
      },
    },
  })

  if (!shareLink) {
    throw new Response('Invalid or expired share link', { status: 404 })
  }

  // Check expiry
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    throw new Response('Share link has expired', { status: 410 })
  }

  return Response.json({
    room: shareLink.room,
    permission: shareLink.permission,
    token,
  })
}

export default function SharedCanvas() {
  const { room, permission, token } = useLoaderData<LoaderData>()
  const [mounted, setMounted] = useState(false)

  // Client-only rendering for tldraw
  useEffect(() => {
    setMounted(true)
  }, [])

  const isReadOnly = permission === 'view'

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{room.name}</h1>
          <p className="text-sm text-gray-500">
            {permission === 'view' && 'View only'}
            {permission === 'comment' && 'View & comment'}
            {permission === 'edit' && 'Edit access'}
          </p>
        </div>
        <a
          href="/canvas"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Open in Editor
        </a>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        {mounted ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-4xl">🎨</div>
                  <p className="text-sm text-gray-600">Loading canvas...</p>
                </div>
              </div>
            }
          >
            <CanvasEditor
              persistenceKey={`shared-canvas-${token}`}
              roomId={room.id}
              projectId={room.id}
              // Read-only mode for view permission
              // Note: Actual read-only enforcement would need tldraw prop support
              // For now, we rely on UI indicators and API permission checks
            />
          </Suspense>
        ) : null}
      </div>

      {/* Footer notice */}
      {isReadOnly && (
        <div className="border-t bg-yellow-50 px-4 py-2 text-center text-sm text-yellow-800">
          You are viewing this canvas in read-only mode.
        </div>
      )}
    </div>
  )
}
