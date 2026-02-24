/** Canvas comment API client for CRUD operations */

export interface Comment {
  id: string
  roomId: string
  pageId: string
  x: number
  y: number
  content: string
  authorId: string
  parentId: string | null
  resolved: boolean
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    name: string
    image: string | null
  }
  replies?: Comment[]
}

export interface CreateCommentParams {
  roomId: string
  pageId: string
  x: number
  y: number
  content: string
}

export interface ReplyToCommentParams {
  commentId: string
  content: string
}

/**
 * List all comments for a room + page
 */
export async function listComments(
  roomId: string,
  pageId: string,
): Promise<Comment[]> {
  const response = await fetch(
    `/api/canvas/comments?roomId=${roomId}&pageId=${pageId}`,
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.statusText}`)
  }

  const data = await response.json()
  return data.comments || []
}

/**
 * Create a new comment at canvas coordinates
 */
export async function createComment(
  params: CreateCommentParams,
): Promise<Comment> {
  const response = await fetch('/api/canvas/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Failed to create comment: ${response.statusText}`)
  }

  const data = await response.json()
  return data.comment
}

/**
 * Reply to existing comment (threaded)
 */
export async function replyToComment(
  params: ReplyToCommentParams,
): Promise<Comment> {
  const response = await fetch('/api/canvas/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentId: params.commentId,
      content: params.content,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to reply to comment: ${response.statusText}`)
  }

  const data = await response.json()
  return data.comment
}

/**
 * Resolve or unresolve a comment
 */
export async function resolveComment(
  commentId: string,
  resolved: boolean,
): Promise<void> {
  const response = await fetch(`/api/canvas/comments`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentId, resolved }),
  })

  if (!response.ok) {
    throw new Error(`Failed to resolve comment: ${response.statusText}`)
  }
}

/**
 * Delete a comment (author only)
 */
export async function deleteComment(commentId: string): Promise<void> {
  const response = await fetch(
    `/api/canvas/comments?commentId=${commentId}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to delete comment: ${response.statusText}`)
  }
}
