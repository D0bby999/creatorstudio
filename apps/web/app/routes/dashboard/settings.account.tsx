import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Route } from './+types/settings.account'
import { requireSession, auth } from '~/lib/auth-server'
import { prisma } from '@creator-studio/db/client'
import { authClient } from '~/lib/auth-client'
import { SettingsShell } from '~/components/settings/settings-shell'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  return { user: session.user }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Password is required' }
  }

  // Verify password by attempting sign-in through better-auth API
  const verification = await auth.api.signInEmail({
    body: { email: session.user.email, password },
    headers: request.headers,
  }).catch(() => null)

  if (!verification?.user) {
    return { error: 'Incorrect password' }
  }

  // Soft delete: set deletedAt timestamp
  await prisma.user.update({
    where: { id: session.user.id },
    data: { deletedAt: new Date() },
  })

  // Revoke all sessions
  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })
  for (const s of sessions) {
    await prisma.session.delete({ where: { id: s.id } })
  }

  return { deleted: true }
}

export default function AccountSettings({ loaderData, actionData }: Route.ComponentProps) {
  const navigate = useNavigate()
  const { user } = loaderData
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  if (actionData?.deleted) {
    // Redirect after deletion
    authClient.signOut().then(() => navigate('/account-deleted'))
    return null
  }

  return (
    <SettingsShell title="Account" description="Manage your account">
      <div className="rounded-lg border border-destructive/20 p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-destructive">Delete Account</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Permanently delete your account and all associated data. This action has a 30-day grace period
            — sign in again to cancel deletion.
          </p>
        </div>

        {!showDelete ? (
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            Delete my account
          </Button>
        ) : (
          <form method="post" className="space-y-4 max-w-sm">
            {actionData?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {actionData.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="delete-password">Enter your password to confirm</Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-gray-300"
              />
              <span>I understand this will permanently delete my account after 30 days</span>
            </label>

            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={!confirmed || loading}>
                {loading ? 'Deleting...' : 'Delete Account'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </SettingsShell>
  )
}
