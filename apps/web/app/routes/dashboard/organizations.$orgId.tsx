// Organization detail page — tabs for overview, members, settings

import { useState } from 'react'
import { Form, redirect, useNavigation } from 'react-router'
import { Crown, Shield, User, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { Badge } from '@creator-studio/ui/components/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@creator-studio/ui/components/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@creator-studio/ui/components/dialog'
import { prisma } from '@creator-studio/db/client'
import { canManageMembers, canDeleteOrganization } from '@creator-studio/auth'
import { requireSession } from '~/lib/auth-server'
import type { Route } from './+types/organizations.$orgId'

export async function loader({ params, request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const orgId = params.orgId

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  })
  if (!membership) throw new Response('Not Found', { status: 404 })

  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return { organization, members, userRole: membership.role, userId: session.user.id }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const actionType = formData.get('action') as string
  const orgId = params.orgId

  try {
    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
    })
    if (!membership) return { error: 'Not a member' }

    switch (actionType) {
      case 'update': {
        if (!canManageMembers(membership.role)) return { error: 'Insufficient permissions' }
        const name = formData.get('name') as string
        const slug = formData.get('slug') as string
        const data: Record<string, string> = {}
        if (name) data.name = name
        if (slug) data.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        if (Object.keys(data).length > 0) {
          await prisma.organization.update({ where: { id: orgId }, data })
        }
        return { success: true }
      }
      case 'delete': {
        if (!canDeleteOrganization(membership.role)) return { error: 'Only owner can delete' }
        await prisma.organization.delete({ where: { id: orgId } })
        return redirect('/dashboard/organizations')
      }
      case 'add-member': {
        if (!canManageMembers(membership.role)) return { error: 'Insufficient permissions' }
        const email = formData.get('email') as string
        const role = (formData.get('role') as string) || 'member'
        if (role !== 'member' && membership.role !== 'owner') return { error: 'Only owner can assign elevated roles' }
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return { error: 'User not found' }
        await prisma.organizationMember.create({ data: { userId: user.id, organizationId: orgId, role } })
        return { success: true }
      }
      case 'remove-member': {
        if (!canManageMembers(membership.role)) return { error: 'Insufficient permissions' }
        const targetUserId = formData.get('userId') as string
        const target = await prisma.organizationMember.findUnique({
          where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
        })
        if (!target) return { error: 'Member not found' }
        if (target.role === 'owner' && membership.role !== 'owner') return { error: 'Only owner can remove owners' }
        if (target.role === 'owner') {
          const count = await prisma.organizationMember.count({ where: { organizationId: orgId, role: 'owner' } })
          if (count <= 1) return { error: 'Cannot remove the last owner' }
        }
        await prisma.organizationMember.delete({
          where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
        })
        return { success: true }
      }
      default:
        return { error: 'Invalid action' }
    }
  } catch (error) {
    console.error('Org detail action error:', error)
    return { error: 'Something went wrong' }
  }
}

const roleIcons = { owner: Crown, admin: Shield, member: User } as const

export default function OrganizationDetailPage({ loaderData, actionData }: Route.ComponentProps) {
  const { organization, members, userRole, userId } = loaderData
  const isAdmin = userRole === 'owner' || userRole === 'admin'
  const isOwner = userRole === 'owner'
  const navigation = useNavigation()
  const busy = navigation.state === 'submitting'
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{organization.name}</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">/{organization.slug}</p>
      </div>

      {actionData && 'error' in actionData && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {actionData.error}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <Card className="mt-4 p-6">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Name</dt>
                <dd className="mt-1">{organization.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Slug</dt>
                <dd className="mt-1 font-mono text-sm">{organization.slug}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Created</dt>
                <dd className="mt-1">{new Date(organization.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Your Role</dt>
                <dd className="mt-1">
                  <Badge variant="secondary">{userRole}</Badge>
                </dd>
              </div>
            </dl>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card className="mt-4 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Members</h2>
              {isAdmin && <InviteMemberDialog busy={busy} />}
            </div>
            <div className="space-y-3">
              {members.map((m) => {
                const RoleIcon = roleIcons[m.role as keyof typeof roleIcons] ?? User
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                        {m.user.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.user.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {m.role}
                      </Badge>
                      {isAdmin && m.user.id !== userId && m.role !== 'owner' && (
                        <Form method="post">
                          <input type="hidden" name="action" value="remove-member" />
                          <input type="hidden" name="userId" value={m.user.id} />
                          <Button type="submit" variant="ghost" size="sm" disabled={busy}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </Form>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <Card className="mt-4 p-6">
              <h2 className="mb-4 font-semibold">Organization Settings</h2>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="action" value="update" />
                <div>
                  <Label htmlFor="org-name">Name</Label>
                  <Input id="org-name" name="name" defaultValue={organization.name} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="org-slug">Slug</Label>
                  <Input id="org-slug" name="slug" defaultValue={organization.slug} className="mt-1" />
                </div>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Saving...' : 'Save Changes'}
                </Button>
              </Form>
            </Card>

            {isOwner && (
              <Card className="mt-4 border-red-200 p-6 dark:border-red-800">
                <h2 className="mb-2 font-semibold text-red-600">Danger Zone</h2>
                <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
                  Permanently delete this organization and all its data.
                </p>
                {confirmDelete ? (
                  <Form method="post" className="flex items-center gap-2">
                    <input type="hidden" name="action" value="delete" />
                    <Button type="submit" variant="destructive" disabled={busy}>
                      {busy ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </Form>
                ) : (
                  <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                    Delete Organization
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function InviteMemberDialog({ busy }: { busy: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>Add a team member by email</DialogDescription>
        </DialogHeader>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="action" value="add-member" />
          <div>
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" name="email" type="email" required className="mt-1" placeholder="user@example.com" />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <select id="invite-role" name="role" className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Inviting...' : 'Send Invite'}
          </Button>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
