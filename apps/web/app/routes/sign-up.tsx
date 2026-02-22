import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { redirect } from 'react-router'
import type { Route } from './+types/sign-up'
import { getSession } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
import { AuthLayout } from '~/components/auth/auth-layout'
import { AuthDivider } from '~/components/auth/auth-divider'
import { OAuthButtons } from '~/components/auth/oauth-buttons'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request)
  if (session) throw redirect('/dashboard')
  return {}
}

export default function SignUp() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    await authClient.signUp.email(
      { name, email, password },
      {
        onSuccess: () => setEmailSent(true),
        onError: (ctx) => setError(ctx.error.message ?? 'Sign up failed'),
      },
    )
    setLoading(false)
  }

  if (emailSent) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a verification link to <strong>{email}</strong>.
              Please verify your email to complete sign up.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await authClient.sendVerificationEmail({ email })
            }}
          >
            Resend verification email
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Create an account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Get started with Creator Studio</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>

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
            <Label htmlFor="password">Password</Label>
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

          <Button type="submit" className="w-full press-scale" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <AuthDivider />

        <OAuthButtons />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
