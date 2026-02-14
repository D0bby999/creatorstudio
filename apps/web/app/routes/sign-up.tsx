import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { authClient } from '~/lib/auth-client'
import { AuthLayout } from '~/components/auth/auth-layout'
import { Button } from '@creator-studio/ui/components/button'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'

export default function SignUp() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    await authClient.signUp.email(
      { name, email, password },
      {
        onSuccess: () => navigate('/dashboard'),
        onError: (ctx) => setError(ctx.error.message ?? 'Sign up failed'),
      },
    )
    setLoading(false)
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
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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
