import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { prisma } from '@creator-studio/db'
import { auth } from '~/lib/auth-server'

/**
 * GET: List comments for room + page
 * POST: Create comment or reply
 * PATCH: Resolve/unresolve comment
 * DELETE: Delete comment (author only)
 */

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const roomId = url.searchParams.get('roomId')
  const pageId = url.searchParams.get('pageId')

  if (!roomId || !pageId) {
    return Response.json({ error: 'Missing roomId or pageId' }, { status: 400 })
  }

  // Verify user has access to room
  const room = await prisma.canvasRoom.findFirst({
    where: {
      id: roomId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  })

  if (!room) {
    return Response.json({ error: 'Room not found or access denied' }, { status: 403 })
  }

  // Fetch comments with author and replies
  const comments = await prisma.canvasComment.findMany({
    where: {
      roomId,
      pageId,
      parentId: null, // Top-level only
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ comments })
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const method = request.method

  // POST: Create comment or reply
  if (method === 'POST') {
    const body = await request.json()
    const { roomId, pageId, x, y, content, parentId } = body

    // Validate content length
    if (!content || content.length > 2000) {
      return Response.json(
        { error: 'Content must be 1-2000 characters' },
        { status: 400 },
      )
    }

    // If reply, verify parent exists and user has room access
    if (parentId) {
      const parent = await prisma.canvasComment.findUnique({
        where: { id: parentId },
        include: { room: true },
      })

      if (!parent) {
        return Response.json({ error: 'Parent comment not found' }, { status: 404 })
      }

      // Verify user has access to the room
      const roomAccess = await prisma.canvasRoom.findFirst({
        where: {
          id: parent.roomId,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      })

      if (!roomAccess) {
        return Response.json({ error: 'Room not found or access denied' }, { status: 403 })
      }

      // Create reply (inherit room/page/position from parent)
      const reply = await prisma.canvasComment.create({
        data: {
          roomId: parent.roomId,
          pageId: parent.pageId,
          x: parent.x,
          y: parent.y,
          content,
          authorId: session.user.id,
          parentId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })

      return Response.json({ comment: reply })
    }

    // Create top-level comment
    if (!roomId || !pageId || x === undefined || y === undefined) {
      return Response.json(
        { error: 'Missing required fields for comment' },
        { status: 400 },
      )
    }

    // Verify room access
    const room = await prisma.canvasRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!room) {
      return Response.json({ error: 'Room not found or access denied' }, { status: 403 })
    }

    const comment = await prisma.canvasComment.create({
      data: {
        roomId,
        pageId,
        x,
        y,
        content,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return Response.json({ comment })
  }

  // PATCH: Resolve/unresolve comment
  if (method === 'PATCH') {
    const body = await request.json()
    const { commentId, resolved } = body

    if (!commentId || typeof resolved !== 'boolean') {
      return Response.json(
        { error: 'Missing commentId or resolved flag' },
        { status: 400 },
      )
    }

    // Verify comment exists and user has access
    const comment = await prisma.canvasComment.findUnique({
      where: { id: commentId },
      include: { room: true },
    })

    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only author or room owner can resolve
    if (
      comment.authorId !== session.user.id &&
      comment.room.ownerId !== session.user.id
    ) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.canvasComment.update({
      where: { id: commentId },
      data: { resolved },
    })

    return Response.json({ success: true })
  }

  // DELETE: Delete comment (author only)
  if (method === 'DELETE') {
    const url = new URL(request.url)
    const commentId = url.searchParams.get('commentId')

    if (!commentId) {
      return Response.json({ error: 'Missing commentId' }, { status: 400 })
    }

    const comment = await prisma.canvasComment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only author can delete
    if (comment.authorId !== session.user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete comment and all replies (cascade)
    await prisma.canvasComment.delete({
      where: { id: commentId },
    })

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
