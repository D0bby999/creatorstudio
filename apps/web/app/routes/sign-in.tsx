import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { redirect } from 'react-router'
import type { Route } from './+types/sign-in'
import { getSession } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
import { sanitizeReturnTo } from '~/lib/url-helpers'
import { AuthLayout } from '~/components/auth/auth-layout'
import { AuthDivider } from '~/components/auth/auth-divider'
import { OAuthButtons } from '~/components/auth/oauth-buttons'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request)
  if (session) throw redirect('/dashboard')
  const returnTo = sanitizeReturnTo(new URL(request.url).searchParams.get('returnTo'))
  return { returnTo }
}

export default function SignIn({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: (ctx) => {
          if (ctx.data?.twoFactorRedirect) {
            sessionStorage.setItem('2fa-email', email)
            navigate(`/sign-in/verify-2fa?returnTo=${encodeURIComponent(loaderData.returnTo || '/dashboard')}`)
          } else {
            navigate(loaderData.returnTo || '/dashboard')
          }
        },
        onError: (ctx) => setError(ctx.error.message ?? 'Sign in failed'),
      },
    )
    setLoading(false)
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to Creator Studio</p>
        </div>

        {resetSuccess && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200" role="status">
            Password reset successful. Sign in with your new password.
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert" aria-live="polite">
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full press-scale" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <AuthDivider />

        <OAuthButtons />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
