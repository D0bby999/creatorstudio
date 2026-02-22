import { useState } from 'react'
import type { Route } from './+types/settings.security'
import { requireSession } from '~/lib/auth-server'
import { prisma } from '@creator-studio/db/client'
import { authClient } from '~/lib/auth-client'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'
import { QrCodeDisplay } from '~/components/auth/qr-code-display'
import { TotpInput } from '~/components/auth/totp-input'
import { BackupCodesDisplay } from '~/components/auth/backup-codes-display'
import { SettingsShell } from '~/components/settings/settings-shell'

type SetupStep = 'idle' | 'password' | 'qr' | 'verify' | 'backup' | 'done'

function extractSecretFromUri(uri: string): string {
  const match = uri.match(/secret=([A-Z2-7]+)/i)
  return match?.[1] ?? ''
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  })
  return { twoFactorEnabled: user?.twoFactorEnabled ?? false }
}

export default function SecuritySettings({ loaderData }: Route.ComponentProps) {
  const [step, setStep] = useState<SetupStep>('idle')
  const [totpUri, setTotpUri] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [is2faEnabled, setIs2faEnabled] = useState(loaderData.twoFactorEnabled)
  const [enablePassword, setEnablePassword] = useState('')

  // Disable 2FA state
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisable, setShowDisable] = useState(false)

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await authClient.twoFactor.enable({ password: enablePassword })
    if (result.data) {
      setTotpUri(result.data.totpURI)
      setSecret(extractSecretFromUri(result.data.totpURI))
      setBackupCodes(result.data.backupCodes)
      setStep('qr')
    } else {
      setError(result.error?.message ?? 'Failed to enable 2FA')
    }
    setLoading(false)
  }

  const handleVerifyCode = async (code: string) => {
    setError('')
    setLoading(true)
    const result = await authClient.twoFactor.verifyTotp({ code })
    if (result.data) {
      setTotpUri('')
      setSecret('')
      setStep('backup')
      setIs2faEnabled(true)
    } else {
      setError(result.error?.message ?? 'Invalid code. Try again.')
    }
    setLoading(false)
  }

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await authClient.twoFactor.disable({ password: disablePassword })
    if (result.data) {
      setIs2faEnabled(false)
      setShowDisable(false)
      setDisablePassword('')
      setStep('idle')
    } else {
      setError(result.error?.message ?? 'Failed to disable 2FA')
    }
    setLoading(false)
  }

  return (
    <SettingsShell title="Security" description="Manage two-factor authentication">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {step === 'idle' && !is2faEnabled && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account with two-factor authentication (2FA).
          </p>
          <Button onClick={() => setStep('password')} disabled={loading}>
            Enable Two-Factor Authentication
          </Button>
        </div>
      )}

      {step === 'password' && (
        <form onSubmit={handleEnable2FA} className="space-y-4 max-w-sm">
          <h3 className="font-semibold">Confirm your password</h3>
          <div className="space-y-2">
            <Label htmlFor="enable-password">Password</Label>
            <Input
              id="enable-password"
              type="password"
              value={enablePassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnablePassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep('idle')}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {step === 'qr' && (
        <div className="space-y-6 max-w-sm">
          <h3 className="font-semibold">Step 1: Scan QR Code</h3>
          <QrCodeDisplay totpUri={totpUri} secret={secret} />
          <div className="space-y-2">
            <h3 className="font-semibold">Step 2: Enter verification code</h3>
            <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
            <TotpInput onComplete={handleVerifyCode} disabled={loading} />
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-6 max-w-sm">
          <h3 className="font-semibold">Save your backup codes</h3>
          <BackupCodesDisplay codes={backupCodes} />
          <Button className="w-full" onClick={() => setStep('done')}>
            I've saved my backup codes
          </Button>
        </div>
      )}

      {(step === 'done' || (step === 'idle' && is2faEnabled)) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              Enabled
            </span>
            <span className="text-sm">Two-factor authentication is active</span>
          </div>

          {!showDisable ? (
            <Button variant="outline" onClick={() => setShowDisable(true)}>
              Disable 2FA
            </Button>
          ) : (
            <form onSubmit={handleDisable2FA} className="space-y-3 max-w-sm">
              <Label htmlFor="disable-password">Enter your password to disable 2FA</Label>
              <Input
                id="disable-password"
                type="password"
                value={disablePassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisablePassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" disabled={loading}>
                  {loading ? 'Disabling...' : 'Disable 2FA'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowDisable(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </SettingsShell>
  )
}
