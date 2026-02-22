import { useState } from 'react'
import type { Route } from './+types/settings.sessions'
import { requireSession } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
import { prisma } from '@creator-studio/db/client'
import { SessionCard } from '~/components/auth/session-card'
import { SettingsShell } from '~/components/settings/settings-shell'
import { Button } from '@creator-studio/ui/components/button'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      token: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return {
    sessions: sessions.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    currentSessionId: session.session.id,
  }
}

export default function SessionsSettings({ loaderData }: Route.ComponentProps) {
  const { sessions, currentSessionId } = loaderData
  const [revokedIds, setRevokedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const handleRevoke = async (sessionId: string) => {
    setLoading(true)
    // Find the session token (revokeSession expects token, not id)
    const sessionToken = sessions.find((s) => s.id === sessionId)?.token
    if (!sessionToken) return setLoading(false)
    const result = await authClient.revokeSession({ token: sessionToken })
    if (!result.error) {
      setRevokedIds((prev) => new Set([...prev, sessionId]))
    }
    setLoading(false)
  }

  const handleRevokeAll = async () => {
    setLoading(true)
    const result = await authClient.revokeOtherSessions()
    if (!result.error) {
      const otherIds = sessions.filter((s) => s.id !== currentSessionId).map((s) => s.id)
      setRevokedIds(new Set(otherIds))
    }
    setLoading(false)
  }

  const activeSessions = sessions.filter((s) => !revokedIds.has(s.id))
  const otherCount = activeSessions.filter((s) => s.id !== currentSessionId).length

  return (
    <SettingsShell title="Sessions" description="Manage your active sessions">
      {otherCount > 0 && (
        <Button variant="outline" onClick={handleRevokeAll} disabled={loading}>
          Revoke all other sessions ({otherCount})
        </Button>
      )}

      <div className="space-y-3">
        {activeSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            isCurrent={session.id === currentSessionId}
            onRevoke={handleRevoke}
            loading={loading}
          />
        ))}

        {activeSessions.length === 0 && (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        )}
      </div>
    </SettingsShell>
  )
}
