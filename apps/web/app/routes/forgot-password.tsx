import { useState } from 'react'
import { Link } from 'react-router'
import { redirect } from 'react-router'
import type { Route } from './+types/forgot-password'
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

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    })

    if (result.error) {
      setError(result.error.message ?? 'Failed to send reset email')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists with <strong>{email}</strong>, we've sent a password reset link.
            </p>
          </div>
          <Link to="/sign-in" className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Forgot password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full press-scale" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link to="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
