import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { redirect } from 'react-router'
import type { Route } from './+types/reset-password'
import { getSession } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
import { AuthLayout } from '~/components/auth/auth-layout'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request)
  if (session) throw redirect('/dashboard')
  return {}
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Invalid link</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <Link to="/forgot-password" className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    await authClient.resetPassword(
      { newPassword: password, token },
      {
        onSuccess: () => navigate('/sign-in?reset=success'),
        onError: (ctx) => setError(ctx.error.message ?? 'Failed to reset password'),
      },
    )
    setLoading(false)
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Set new password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a new password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full press-scale" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
