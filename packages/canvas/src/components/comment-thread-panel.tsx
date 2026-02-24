import { useState } from 'react'
import type { Comment } from '../lib/comments/comment-client'
import {
  replyToComment,
  resolveComment,
  deleteComment,
} from '../lib/comments/comment-client'

interface CommentThreadPanelProps {
  comment: Comment
  currentUserId: string
  onClose: () => void
  onUpdate: () => void
}

export function CommentThreadPanel({
  comment,
  currentUserId,
  onClose,
  onUpdate,
}: CommentThreadPanelProps) {
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthor = comment.authorId === currentUserId
  const replies = comment.replies || []

  const handleReply = async () => {
    if (!replyText.trim() || loading) return

    setLoading(true)
    setError(null)

    try {
      await replyToComment({
        commentId: comment.id,
        content: replyText.trim(),
      })
      setReplyText('')
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    setLoading(true)
    setError(null)

    try {
      await resolveComment(comment.id, !comment.resolved)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this comment and all replies?')) return

    setLoading(true)
    setError(null)

    try {
      await deleteComment(comment.id)
      onUpdate()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Delete this reply?')) return

    setLoading(true)
    setError(null)

    try {
      await deleteComment(replyId)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reply')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="fixed right-0 top-0 z-30 flex h-full w-96 flex-col border-l bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Comment Thread</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="border-b bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Thread content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Main comment */}
        <div className={`mb-4 rounded-lg border p-3 ${comment.resolved ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
              {comment.author?.name.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{comment.author?.name || 'Unknown'}</div>
              <div className="text-xs text-gray-500">{formatDate(comment.createdAt)}</div>
            </div>
            {comment.resolved && (
              <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                Resolved
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-3 border-l-2 border-gray-200 pl-4">
            {replies.map((reply) => (
              <div key={reply.id} className="rounded-lg border bg-gray-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-xs font-semibold text-white">
                    {reply.author?.name.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{reply.author?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{formatDate(reply.createdAt)}</div>
                  </div>
                  {reply.authorId === currentUserId && (
                    <button
                      onClick={() => handleDeleteReply(reply.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-4">
        {/* Reply input */}
        <div className="mb-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Add a reply..."
            className="w-full resize-none rounded border p-2 text-sm focus:border-blue-500 focus:outline-none"
            rows={3}
            maxLength={2000}
            disabled={loading || comment.resolved}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {replyText.length}/2000
            </span>
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || loading || comment.resolved}
              className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleResolve}
            disabled={loading}
            className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${
              comment.resolved
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                : 'border-green-600 bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {comment.resolved ? 'Unresolve' : 'Resolve'}
          </button>
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded border border-red-600 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
