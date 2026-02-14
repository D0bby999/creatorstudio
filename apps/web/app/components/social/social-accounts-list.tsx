import { useState } from 'react'
import { useFetcher } from 'react-router'
import { Instagram, Plus, Cloud, X } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card, CardContent } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'

interface SocialAccountsListProps {
  accounts: any[]
}

export function SocialAccountsList({ accounts }: SocialAccountsListProps) {
  const [showConnect, setShowConnect] = useState(false)
  const connectFetcher = useFetcher()
  const disconnectFetcher = useFetcher()

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
          <Button variant="outline" size="sm" onClick={() => setShowConnect(!showConnect)}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Bluesky
          </Button>
        </div>

        {showConnect && (
          <div className="mb-4 rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Connect Bluesky Account</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConnect(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <connectFetcher.Form method="post" action="/api/social/connect" className="space-y-3">
              <input type="hidden" name="action" value="connectBluesky" />
              <div>
                <Label htmlFor="handle">Handle</Label>
                <Input id="handle" name="handle" placeholder="username.bsky.social" className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="appPassword">App Password</Label>
                <Input id="appPassword" name="appPassword" type="password" placeholder="xxxx-xxxx-xxxx-xxxx" className="mt-1" required />
                <p className="mt-1 text-sm text-muted-foreground">Generate an app password in your Bluesky settings</p>
              </div>
              {connectFetcher.data?.error && <p className="text-sm text-destructive">{connectFetcher.data.error}</p>}
              {connectFetcher.data?.success && <p className="text-sm text-success">Connected @{connectFetcher.data.username} successfully!</p>}
              <Button type="submit" disabled={connectFetcher.state === 'submitting'}>
                {connectFetcher.state === 'submitting' ? 'Connecting...' : 'Connect'}
              </Button>
            </connectFetcher.Form>
          </div>
        )}

        {accounts.length === 0 ? (
          <EmptyState
            icon={<Cloud className="h-12 w-12" />}
            title="No accounts connected"
            description="Connect your social media accounts to start scheduling posts"
          />
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const PlatformIcon = account.platform === 'bluesky' ? Cloud : Instagram
              return (
                <div key={account.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">@{account.username}</p>
                      <p className="text-sm text-muted-foreground">{account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</p>
                    </div>
                  </div>
                  <disconnectFetcher.Form method="post" action="/api/social/connect">
                    <input type="hidden" name="action" value="disconnect" />
                    <input type="hidden" name="accountId" value={account.id} />
                    <Button type="submit" variant="outline" size="sm" disabled={disconnectFetcher.state === 'submitting'}>
                      {disconnectFetcher.state === 'submitting' ? 'Removing...' : 'Disconnect'}
                    </Button>
                  </disconnectFetcher.Form>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
