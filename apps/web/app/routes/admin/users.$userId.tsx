import { Link } from 'react-router'
import type { Route } from './+types/users.$userId'
import { requireAdmin } from '~/lib/admin-helpers'
import { prisma } from '@creator-studio/db/client'
import { logAudit, getAuditLogs } from '@creator-studio/db/lib/audit-log'
import { Button } from '@creator-studio/ui/components/button'
import { ArrowLeft, Shield } from 'lucide-react'

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request)

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      banReason: true,
      emailVerified: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { sessions: true, projects: true, socialAccounts: true },
      },
    },
  })

  if (!user) throw new Response('User not found', { status: 404 })

  const auditLogs = await getAuditLogs({ targetId: user.id, limit: 20 })

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt?.toISOString() ?? null,
    },
    auditLogs: auditLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request)
  const formData = await request.formData()
  const actionType = formData.get('action') as string

  switch (actionType) {
    case 'ban':
      await prisma.user.update({ where: { id: params.userId }, data: { banned: true } })
      await logAudit('user.banned', { actorId: session.user.id, targetId: params.userId })
      break
    case 'unban':
      await prisma.user.update({ where: { id: params.userId }, data: { banned: false } })
      await logAudit('user.unbanned', { actorId: session.user.id, targetId: params.userId })
      break
    default:
      return { error: 'Invalid action' }
  }

  return { success: true }
}

export default function AdminUserDetail({ loaderData }: Route.ComponentProps) {
  const { user, auditLogs } = loaderData

  return (
    <div className="container max-w-4xl py-8 px-4">
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <form method="post">
            {user.banned ? (
              <Button type="submit" name="action" value="unban" variant="outline">
                Unban User
              </Button>
            ) : (
              <Button type="submit" name="action" value="ban" variant="destructive">
                Ban User
              </Button>
            )}
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <InfoCard label="Role" value={user.role} />
        <InfoCard label="Status" value={user.banned ? 'Banned' : user.deletedAt ? 'Deleted' : 'Active'} />
        <InfoCard label="Verified" value={user.emailVerified ? 'Yes' : 'No'} />
        <InfoCard label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Sessions" count={user._count.sessions} />
        <StatCard label="Projects" count={user._count.projects} />
        <StatCard label="Social Accounts" count={user._count.socialAccounts} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Audit Log
        </h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events for this user.</p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <span className="font-medium">{log.action}</span>
                  <span className="text-muted-foreground ml-2">
                    by {log.actor?.name ?? 'Unknown'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  )
}

function StatCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
