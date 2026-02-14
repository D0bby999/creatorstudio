// Organization list page — shows user's orgs with create dialog

import { useState } from 'react'
import { Form, Link, useNavigation } from 'react-router'
import { Building2, Plus, Users, Crown, Shield, User } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { PageHeader } from '@creator-studio/ui/components/composites/page-header'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@creator-studio/ui/components/dialog'
import { Badge } from '@creator-studio/ui/components/badge'
import { prisma } from '@creator-studio/db/client'
import { requireSession } from '~/lib/auth-server'
import type { Route } from './+types/organizations'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { memberships }
}

const roleIcons = { owner: Crown, admin: Shield, member: User } as const

function getRoleIcon(role: string) {
  return roleIcons[role as keyof typeof roleIcons] ?? User
}

export default function OrganizationsPage({ loaderData }: Route.ComponentProps) {
  const { memberships } = loaderData
  const [dialogOpen, setDialogOpen] = useState(false)
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className="p-6">
      <PageHeader
        title="Organizations"
        description="Manage your teams and workspaces"
        className="mb-6"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new workspace for your team
              </DialogDescription>
            </DialogHeader>
            <Form method="post" action="/api/organizations" className="space-y-4">
              <input type="hidden" name="action" value="create" />
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  name="name"
                  placeholder="My Team"
                  required
                  minLength={2}
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {memberships.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No organizations yet"
          description="Create your first organization to collaborate with your team"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ organization: org, role }) => {
            const RoleIcon = getRoleIcon(role)
            return (
              <Link key={org.id} to={`/dashboard/organizations/${org.id}`}>
                <Card className="p-5 transition-colors hover:bg-[hsl(var(--accent))]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{org.name}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {org.slug}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {role}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                    <Users className="h-4 w-4" />
                    <span>{org._count.members} member{org._count.members !== 1 ? 's' : ''}</span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
