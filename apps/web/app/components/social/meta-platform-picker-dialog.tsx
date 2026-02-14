// Meta platform picker dialog
// Allows users to select which Meta platforms to connect after OAuth

import { useState, useEffect } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '@creator-studio/ui/components/button'
import { Card, CardContent } from '@creator-studio/ui/components/card'
import { Label } from '@creator-studio/ui/components/label'
import { Instagram, Facebook, MessageCircle, X } from 'lucide-react'

interface DiscoveredAccount {
  platform: string
  platformUserId: string
  name: string
  accessToken: string
  pageId?: string
  pageAccessToken?: string
  expiresIn: number
}

interface MetaPlatformPickerDialogProps {
  show: boolean
  onClose: () => void
}

export function MetaPlatformPickerDialog({ show, onClose }: MetaPlatformPickerDialogProps) {
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const fetcher = useFetcher()

  useEffect(() => {
    if (show) {
      // Read discovered accounts from cookie
      const cookies = document.cookie.split(';')
      const accountsCookie = cookies
        .find((c) => c.trim().startsWith('meta_discovered_accounts='))
        ?.split('=')[1]

      if (accountsCookie) {
        try {
          const accounts = JSON.parse(decodeURIComponent(accountsCookie))
          setDiscoveredAccounts(accounts)
          // Pre-select all accounts
          setSelectedAccounts(new Set(accounts.map((_: any, i: number) => i.toString())))
        } catch (error) {
          console.error('Failed to parse discovered accounts:', error)
        }
      }
    }
  }, [show])

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedAccounts)
    const key = index.toString()
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedAccounts(newSelected)
  }

  const handleConnect = () => {
    const selected = discoveredAccounts.filter((_, i) => selectedAccounts.has(i.toString()))
    const formData = new FormData()
    formData.append('action', 'connectMeta')
    formData.append('accounts', JSON.stringify(selected))

    fetcher.submit(formData, { method: 'post', action: '/api/social/connect' })
  }

  useEffect(() => {
    if (fetcher.data?.success) {
      onClose()
    }
  }, [fetcher.data, onClose])

  if (!show) return null

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />
      case 'facebook':
        return <Facebook className="h-5 w-5" />
      case 'threads':
        return <MessageCircle className="h-5 w-5" />
      default:
        return null
    }
  }

  const getPlatformLabel = (account: DiscoveredAccount) => {
    const platformName = account.platform.charAt(0).toUpperCase() + account.platform.slice(1)
    return `${platformName}: ${account.name}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Connect Meta Accounts</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {discoveredAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts found. Please try again.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Select the accounts you want to connect:
              </p>

              <div className="mb-4 space-y-3">
                {discoveredAccounts.map((account, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                    <input
                      type="checkbox"
                      id={`account-${index}`}
                      checked={selectedAccounts.has(index.toString())}
                      onChange={() => handleToggle(index)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`account-${index}`} className="flex flex-1 cursor-pointer items-center gap-3">
                      {getPlatformIcon(account.platform)}
                      <span>{getPlatformLabel(account)}</span>
                    </Label>
                  </div>
                ))}
              </div>

              {fetcher.data?.error && <p className="mb-3 text-sm text-destructive">{fetcher.data.error}</p>}

              <div className="flex gap-2">
                <Button
                  onClick={handleConnect}
                  disabled={selectedAccounts.size === 0 || fetcher.state === 'submitting'}
                  className="flex-1"
                >
                  {fetcher.state === 'submitting' ? 'Connecting...' : `Connect Selected (${selectedAccounts.size})`}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
