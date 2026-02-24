import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { prisma } from '@creator-studio/db'
import { auth } from '~/lib/auth-server'

/**
 * GET: List share links for room OR validate token
 * POST: Create share link (room owner only)
 * DELETE: Revoke share link
 */

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const roomId = url.searchParams.get('roomId')
  const token = url.searchParams.get('token')

  // Token validation (public, no auth required)
  if (token) {
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
      return Response.json({ error: 'Invalid token' }, { status: 404 })
    }

    // Check expiry
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return Response.json({ error: 'Link expired' }, { status: 410 })
    }

    return Response.json({ shareLink })
  }

  // List share links (requires auth)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!roomId) {
    return Response.json({ error: 'Missing roomId' }, { status: 400 })
  }

  // Verify room ownership
  const room = await prisma.canvasRoom.findFirst({
    where: {
      id: roomId,
      ownerId: session.user.id,
    },
  })

  if (!room) {
    return Response.json({ error: 'Room not found or access denied' }, { status: 403 })
  }

  const shareLinks = await prisma.canvasShareLink.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ shareLinks })
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const method = request.method

  // POST: Create share link
  if (method === 'POST') {
    const body = await request.json()
    const { roomId, permission, expiresAt } = body

    if (!roomId || !permission) {
      return Response.json(
        { error: 'Missing roomId or permission' },
        { status: 400 },
      )
    }

    // Validate permission
    if (!['view', 'comment', 'edit'].includes(permission)) {
      return Response.json({ error: 'Invalid permission' }, { status: 400 })
    }

    // Verify room ownership
    const room = await prisma.canvasRoom.findFirst({
      where: {
        id: roomId,
        ownerId: session.user.id,
      },
    })

    if (!room) {
      return Response.json({ error: 'Room not found or access denied' }, { status: 403 })
    }

    // Generate unique token
    const token = crypto.randomUUID()

    // Create share link
    const shareLink = await prisma.canvasShareLink.create({
      data: {
        roomId,
        token,
        permission,
        createdById: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return Response.json({ shareLink })
  }

  // DELETE: Revoke share link
  if (method === 'DELETE') {
    const url = new URL(request.url)
    const linkId = url.searchParams.get('linkId')

    if (!linkId) {
      return Response.json({ error: 'Missing linkId' }, { status: 400 })
    }

    // Verify ownership
    const shareLink = await prisma.canvasShareLink.findUnique({
      where: { id: linkId },
      include: { room: true },
    })

    if (!shareLink) {
      return Response.json({ error: 'Share link not found' }, { status: 404 })
    }

    if (shareLink.room.ownerId !== session.user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.canvasShareLink.delete({
      where: { id: linkId },
    })

    return Response.json({ success: true })
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
