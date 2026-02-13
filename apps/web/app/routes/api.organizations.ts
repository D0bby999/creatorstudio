// Organization CRUD API route
// Handles create, update, delete orgs + member management

import { prisma } from '@creator-studio/db/client'
import { canManageMembers, canDeleteOrganization } from '@creator-studio/auth'
import { requireSession } from '~/lib/auth-server'

interface ActionArgs {
  request: Request
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function getUserOrgRole(userId: string, organizationId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  })
  return member?.role ?? null
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
      case 'add-member':
        return await handleAddMember(session.user.id, formData)
      case 'remove-member':
        return await handleRemoveMember(session.user.id, formData)
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Organization API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleCreate(userId: string, formData: FormData) {
  const name = formData.get('name') as string
  if (!name || name.length < 2 || name.length > 100) {
    return Response.json({ error: 'Name required (2-100 chars)' }, { status: 400 })
  }

  let slug = generateSlug(name)
  if (slug.length < 2) {
    return Response.json({ error: 'Name must produce a valid slug' }, { status: 400 })
  }

  // Atomic create: org + owner membership in transaction
  try {
    const org = await prisma.$transaction(async (tx) => {
      // Handle slug collision by appending random suffix
      const existing = await tx.organization.findUnique({ where: { slug } })
      if (existing) slug = `${slug}-${Date.now().toString(36)}`

      const created = await tx.organization.create({ data: { name, slug } })
      await tx.organizationMember.create({
        data: { userId, organizationId: created.id, role: 'owner' },
      })
      return created
    })

    return Response.json({ organization: org }, { status: 201 })
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return Response.json({ error: 'Organization slug already exists' }, { status: 409 })
    }
    throw error
  }
}

async function handleUpdate(userId: string, formData: FormData) {
  const organizationId = formData.get('organizationId') as string
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  if (!organizationId) {
    return Response.json({ error: 'organizationId required' }, { status: 400 })
  }

  const role = await getUserOrgRole(userId, organizationId)
  if (!role || !canManageMembers(role)) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const data: Record<string, string> = {}
  if (name) {
    if (name.length < 2 || name.length > 100) {
      return Response.json({ error: 'Name must be 2-100 chars' }, { status: 400 })
    }
    data.name = name
  }
  if (slug) {
    const sanitizedSlug = generateSlug(slug)
    if (sanitizedSlug.length < 2) {
      return Response.json({ error: 'Invalid slug' }, { status: 400 })
    }
    // Check slug uniqueness
    const existing = await prisma.organization.findUnique({ where: { slug: sanitizedSlug } })
    if (existing && existing.id !== organizationId) {
      return Response.json({ error: 'Slug already taken' }, { status: 409 })
    }
    data.slug = sanitizedSlug
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data,
  })

  return Response.json({ organization: org })
}

async function handleDelete(userId: string, formData: FormData) {
  const organizationId = formData.get('organizationId') as string
  if (!organizationId) {
    return Response.json({ error: 'organizationId required' }, { status: 400 })
  }

  const role = await getUserOrgRole(userId, organizationId)
  if (!role || !canDeleteOrganization(role)) {
    return Response.json({ error: 'Only owner can delete organization' }, { status: 403 })
  }

  await prisma.organization.delete({ where: { id: organizationId } })
  return Response.json({ success: true })
}

async function handleAddMember(userId: string, formData: FormData) {
  const organizationId = formData.get('organizationId') as string
  const email = formData.get('email') as string
  const memberRole = (formData.get('role') as string) || 'member'

  if (!organizationId || !email) {
    return Response.json({ error: 'organizationId and email required' }, { status: 400 })
  }

  if (!['owner', 'admin', 'member'].includes(memberRole)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 })
  }

  const role = await getUserOrgRole(userId, organizationId)
  if (!role || !canManageMembers(role)) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Only owner can assign admin or owner roles (prevents privilege escalation)
  if (memberRole !== 'member' && role !== 'owner') {
    return Response.json({ error: 'Only owner can assign admin or owner roles' }, { status: 403 })
  }

  const targetUser = await prisma.user.findUnique({ where: { email } })
  if (!targetUser) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if already member
  const existingMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: targetUser.id, organizationId } },
  })
  if (existingMember) {
    return Response.json({ error: 'User is already a member' }, { status: 409 })
  }

  const member = await prisma.organizationMember.create({
    data: { userId: targetUser.id, organizationId, role: memberRole },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return Response.json({ member }, { status: 201 })
}

async function handleRemoveMember(userId: string, formData: FormData) {
  const organizationId = formData.get('organizationId') as string
  const targetUserId = formData.get('userId') as string

  if (!organizationId || !targetUserId) {
    return Response.json({ error: 'organizationId and userId required' }, { status: 400 })
  }

  const role = await getUserOrgRole(userId, organizationId)
  if (!role || !canManageMembers(role)) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Fetch target member to check their role
  const targetMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId } },
  })
  if (!targetMember) {
    return Response.json({ error: 'Member not found' }, { status: 404 })
  }

  // Only owners can remove other owners (prevents admin privilege escalation)
  if (targetMember.role === 'owner' && role !== 'owner') {
    return Response.json({ error: 'Only owner can remove owners' }, { status: 403 })
  }

  // Prevent removing the last owner
  if (targetMember.role === 'owner') {
    const ownerCount = await prisma.organizationMember.count({
      where: { organizationId, role: 'owner' },
    })
    if (ownerCount <= 1) {
      return Response.json({ error: 'Cannot remove the last owner' }, { status: 400 })
    }
  }

  await prisma.organizationMember.delete({
    where: { userId_organizationId: { userId: targetUserId, organizationId } },
  })

  return Response.json({ success: true })
}
