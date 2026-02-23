// Canvas room CRUD API route
// Handles room creation, listing, updates, deletion, and member invitations

import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'

interface ActionArgs {
  request: Request
}

interface LoaderArgs {
  request: Request
}

export async function loader({ request }: LoaderArgs) {
  const session = await requireSession(request)

  try {
    // List all rooms where user is owner or member
    const rooms = await prisma.canvasRoom.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return Response.json({ rooms })
  } catch (error) {
    console.error('[api.canvas.rooms] Loader error:', error)
    return Response.json({ error: 'Failed to load rooms' }, { status: 500 })
  }
}

export async function action({ request }: ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const actionType = formData.get('action') as string

  try {
    switch (actionType) {
      case 'create':
        return await handleCreate(session.user.id, formData)
      case 'update':
        return await handleUpdate(session.user.id, formData)
      case 'delete':
        return await handleDelete(session.user.id, formData)
      case 'invite-member':
        return await handleInviteMember(session.user.id, formData)
      case 'remove-member':
        return await handleRemoveMember(session.user.id, formData)
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[api.canvas.rooms] Action error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleCreate(userId: string, formData: FormData) {
  const name = formData.get('name') as string

  if (!name || name.length < 2 || name.length > 100) {
    return Response.json({ error: 'Name required (2-100 chars)' }, { status: 400 })
  }

  const room = await prisma.canvasRoom.create({
    data: {
      name,
      ownerId: userId,
      snapshot: {},
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
    },
  })

  return Response.json({ room }, { status: 201 })
}

async function handleUpdate(userId: string, formData: FormData) {
  const roomId = formData.get('roomId') as string
  const name = formData.get('name') as string

  if (!roomId || !name || name.length < 2 || name.length > 100) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Verify ownership
  const room = await prisma.canvasRoom.findUnique({ where: { id: roomId } })
  if (!room || room.ownerId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.canvasRoom.update({
    where: { id: roomId },
    data: { name },
    include: {
      owner: { select: { id: true, name: true, image: true } },
    },
  })

  return Response.json({ room: updated })
}

async function handleDelete(userId: string, formData: FormData) {
  const roomId = formData.get('roomId') as string

  if (!roomId) {
    return Response.json({ error: 'Room ID required' }, { status: 400 })
  }

  // Verify ownership
  const room = await prisma.canvasRoom.findUnique({ where: { id: roomId } })
  if (!room || room.ownerId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.canvasRoom.delete({ where: { id: roomId } })

  return Response.json({ success: true })
}

async function handleInviteMember(userId: string, formData: FormData) {
  const roomId = formData.get('roomId') as string
  const inviteeEmail = formData.get('email') as string
  const role = (formData.get('role') as string) || 'editor'

  if (!roomId || !inviteeEmail) {
    return Response.json({ error: 'Room ID and email required' }, { status: 400 })
  }

  if (!['editor', 'viewer'].includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Verify ownership or editor role
  const room = await prisma.canvasRoom.findUnique({
    where: { id: roomId },
    include: { members: true },
  })

  if (!room) {
    return Response.json({ error: 'Room not found' }, { status: 404 })
  }

  const isOwner = room.ownerId === userId
  const isMember = room.members.some((m) => m.userId === userId && m.role === 'editor')

  if (!isOwner && !isMember) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Find user by email
  const invitee = await prisma.user.findUnique({ where: { email: inviteeEmail } })
  if (!invitee) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Create membership
  const member = await prisma.roomMember.create({
    data: {
      roomId,
      userId: invitee.id,
      role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  return Response.json({ member }, { status: 201 })
}

async function handleRemoveMember(userId: string, formData: FormData) {
  const roomId = formData.get('roomId') as string
  const memberId = formData.get('memberId') as string

  if (!roomId || !memberId) {
    return Response.json({ error: 'Room ID and member ID required' }, { status: 400 })
  }

  // Verify ownership
  const room = await prisma.canvasRoom.findUnique({ where: { id: roomId } })
  if (!room || room.ownerId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.roomMember.delete({ where: { id: memberId } })

  return Response.json({ success: true })
}
