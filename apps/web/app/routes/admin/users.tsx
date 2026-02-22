import { useState } from 'react'
import { Link, useSearchParams, useRevalidator } from 'react-router'
import type { Route } from './+types/users'
import { requireAdmin } from '~/lib/admin-helpers'
import { prisma } from '@creator-studio/db/client'
import { logAudit } from '@creator-studio/db/lib/audit-log'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 50

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAdmin(request)
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const search = url.searchParams.get('search') || ''
  const roleFilter = url.searchParams.get('role') || 'all'
  const statusFilter = url.searchParams.get('status') || 'all'

  const where = {
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(roleFilter !== 'all' && { role: roleFilter }),
    ...(statusFilter === 'banned' && { banned: true }),
    ...(statusFilter === 'active' && { banned: false, deletedAt: null }),
    ...(statusFilter === 'deleted' && { deletedAt: { not: null } }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        deletedAt: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      deletedAt: u.deletedAt?.toISOString() ?? null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
    adminId: session.user.id,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAdmin(request)
  const formData = await request.formData()
  const actionType = formData.get('action') as string
  const userId = formData.get('userId') as string

  if (!userId) return { error: 'User ID required' }

  switch (actionType) {
    case 'ban':
      await prisma.user.update({ where: { id: userId }, data: { banned: true } })
      await logAudit('user.banned', { actorId: session.user.id, targetId: userId })
      break
    case 'unban':
      await prisma.user.update({ where: { id: userId }, data: { banned: false } })
      await logAudit('user.unbanned', { actorId: session.user.id, targetId: userId })
      break
    default:
      return { error: 'Invalid action' }
  }

  return { success: true }
}

export default function AdminUsers({ loaderData }: Route.ComponentProps) {
  const { users, total, page, totalPages } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const revalidator = useRevalidator()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams((prev) => {
      prev.set('search', search)
      prev.set('page', '1')
      return prev
    })
  }

  const handleFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      prev.set(key, value)
      prev.set('page', '1')
      return prev
    })
  }

  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">{total} total users</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>

        <select
          className="rounded-md border px-3 py-1.5 text-sm bg-background"
          value={searchParams.get('role') || 'all'}
          onChange={(e) => handleFilter('role', e.target.value)}
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select
          className="rounded-md border px-3 py-1.5 text-sm bg-background"
          value={searchParams.get('status') || 'all'}
          onChange={(e) => handleFilter('status', e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div>
                    <Link to={`/admin/users/${user.id}`} className="font-medium hover:underline">
                      {user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.banned ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                      Banned
                    </span>
                  ) : user.deletedAt ? (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Deleted
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <form method="post" className="inline">
                    <input type="hidden" name="userId" value={user.id} />
                    {user.banned ? (
                      <Button type="submit" name="action" value="unban" variant="ghost" size="sm">
                        Unban
                      </Button>
                    ) : (
                      <Button type="submit" name="action" value="ban" variant="ghost" size="sm" className="text-destructive">
                        Ban
                      </Button>
                    )}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setSearchParams((prev) => { prev.set('page', String(page - 1)); return prev })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setSearchParams((prev) => { prev.set('page', String(page + 1)); return prev })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
