import type { Editor } from 'tldraw'
import { useEffect, useState } from 'react'
import type { Comment } from '../lib/comments/comment-client'

interface CommentMarkerProps {
  editor: Editor
  comment: Comment
  onClick: (comment: Comment) => void
  isSelected: boolean
}

export function CommentMarker({
  editor,
  comment,
  onClick,
  isSelected,
}: CommentMarkerProps) {
  const [screenPosition, setScreenPosition] = useState<{ x: number; y: number } | null>(null)

  // Convert canvas coordinates to screen position
  useEffect(() => {
    const updatePosition = () => {
      const point = editor.pageToScreen({ x: comment.x, y: comment.y })
      setScreenPosition(point)
    }

    updatePosition()

    // Update on camera changes (pan/zoom)
    const dispose = editor.store.listen(() => {
      updatePosition()
    }, { scope: 'session' })

    return () => {
      dispose()
    }
  }, [editor, comment.x, comment.y])

  if (!screenPosition) {
    return null
  }

  const isResolved = comment.resolved
  const replyCount = comment.replies?.length || 0

  return (
    <div
      className="pointer-events-auto fixed z-20"
      style={{
        left: screenPosition.x,
        top: screenPosition.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <button
        onClick={() => onClick(comment)}
        className={`group relative flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-lg transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-500'
            : isResolved
              ? 'border-gray-300 bg-gray-100 opacity-60'
              : 'border-orange-500 bg-orange-500 hover:scale-110'
        }`}
        title={comment.content}
      >
        {/* Author initial or icon */}
        <span className="text-xs font-semibold text-white">
          {isResolved ? '✓' : comment.author?.name.charAt(0).toUpperCase() || '💬'}
        </span>

        {/* Reply count badge */}
        {replyCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {replyCount}
          </span>
        )}

        {/* Hover tooltip */}
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
          {comment.author?.name}: {comment.content.slice(0, 50)}
          {comment.content.length > 50 ? '...' : ''}
        </div>
      </button>
    </div>
  )
}

interface CommentMarkersOverlayProps {
  editor: Editor
  comments: Comment[]
  selectedCommentId: string | null
  onCommentClick: (comment: Comment) => void
}

export function CommentMarkersOverlay({
  editor,
  comments,
  selectedCommentId,
  onCommentClick,
}: CommentMarkersOverlayProps) {
  // Get current page ID to filter comments
  const [currentPageId, setCurrentPageId] = useState(editor.getCurrentPageId())

  useEffect(() => {
    const dispose = editor.store.listen(() => {
      const pageId = editor.getCurrentPageId()
      setCurrentPageId(pageId)
    }, { scope: 'document' })

    return () => {
      dispose()
    }
  }, [editor])

  // Filter comments for current page
  const pageComments = comments.filter((c) => c.pageId === currentPageId)

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {pageComments.map((comment) => (
        <CommentMarker
          key={comment.id}
          editor={editor}
          comment={comment}
          onClick={onCommentClick}
          isSelected={comment.id === selectedCommentId}
        />
      ))}
    </div>
  )
}
