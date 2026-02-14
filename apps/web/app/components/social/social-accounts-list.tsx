import { useState, useEffect, useRef } from 'react'
import { useFetcher } from 'react-router'
import { Instagram, Plus, Cloud, X, Facebook, MessageCircle, Video } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card, CardContent } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'

interface SocialAccountsListProps {
  accounts: any[]
}

export function SocialAccountsList({ accounts }: SocialAccountsListProps) {
  const [showConnectBluesky, setShowConnectBluesky] = useState(false)
  const [showConnectMenu, setShowConnectMenu] = useState(false)
  const connectFetcher = useFetcher()
  const disconnectFetcher = useFetcher()
  const menuRef = useRef<HTMLDivElement>(null)

  const handleMetaConnect = () => {
    window.location.href = '/api/oauth/meta/authorize'
  }

  const handleTikTokConnect = () => {
    window.location.href = '/api/oauth/tiktok/authorize'
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowConnectMenu(false)
      }
    }

    if (showConnectMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showConnectMenu])

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
          <div className="relative" ref={menuRef}>
            <Button variant="outline" size="sm" onClick={() => setShowConnectMenu(!showConnectMenu)}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
            {showConnectMenu && (
              <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border bg-background shadow-lg">
                <div className="p-2">
                  <button
                    onClick={handleMetaConnect}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>Meta (Instagram/Facebook/Threads)</span>
                  </button>
                  <button
                    onClick={handleTikTokConnect}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Video className="h-4 w-4" />
                    <span>TikTok</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowConnectBluesky(true)
                      setShowConnectMenu(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Cloud className="h-4 w-4" />
                    <span>Bluesky</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showConnectBluesky && (
          <div className="mb-4 rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Connect Bluesky Account</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConnectBluesky(false)}>
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
              const getPlatformIcon = () => {
                switch (account.platform) {
                  case 'instagram':
                    return Instagram
                  case 'facebook':
                    return Facebook
                  case 'threads':
                    return MessageCircle
                  case 'tiktok':
                    return Video
                  case 'bluesky':
                    return Cloud
                  default:
                    return Cloud
                }
              }

              const getTokenStatus = () => {
                if (!account.expiresAt) return null
                const expiresAt = new Date(account.expiresAt)
                const now = new Date()
                const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                if (daysUntilExpiry < 0) {
                  return <span className="text-xs text-destructive">Expired</span>
                } else if (daysUntilExpiry < 7) {
                  return <span className="text-xs text-yellow-600">Expires in {daysUntilExpiry}d</span>
                } else {
                  return <span className="text-xs text-green-600">Active</span>
                }
              }

              const PlatformIcon = getPlatformIcon()

              return (
                <div key={account.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">@{account.username || 'Unknown'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                        </p>
                        {getTokenStatus()}
                      </div>
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
