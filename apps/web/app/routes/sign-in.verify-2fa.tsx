import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { authClient } from '~/lib/auth-client'
import { sanitizeReturnTo } from '~/lib/url-helpers'
import { AuthLayout } from '~/components/auth/auth-layout'
import { TotpInput } from '~/components/auth/totp-input'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'

export default function Verify2FA() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo')) || '/dashboard'

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [backupCode, setBackupCode] = useState('')

  const handleVerifyTotp = async (code: string) => {
    setError('')
    setLoading(true)
    const result = await authClient.twoFactor.verifyTotp({ code })
    if (result.data) {
      navigate(returnTo)
    } else {
      setError(result.error?.message ?? 'Invalid code')
    }
    setLoading(false)
  }

  const handleVerifyBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await authClient.twoFactor.verifyBackupCode({ code: backupCode.trim() })
    if (result.data) {
      navigate(returnTo)
    } else {
      setError(result.error?.message ?? 'Invalid backup code')
    }
    setLoading(false)
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Two-factor authentication</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {useBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {useBackupCode ? (
          <form onSubmit={handleVerifyBackup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup code</Label>
              <Input
                id="backup-code"
                type="text"
                value={backupCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBackupCode(e.target.value)}
                placeholder="Enter backup code"
                required
                autoComplete="off"
                className="font-mono"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Backup Code'}
            </Button>
          </form>
        ) : (
          <TotpInput onComplete={handleVerifyTotp} disabled={loading} />
        )}

        <Button
          variant="ghost"
          className="w-full text-sm"
          onClick={() => {
            setUseBackupCode(!useBackupCode)
            setError('')
          }}
        >
          {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code'}
        </Button>
      </div>
    </AuthLayout>
  )
}
