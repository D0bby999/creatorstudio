import { Link } from 'react-router'
import type { Route } from './+types/home'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Creator Studio' },
    { name: 'description', content: 'All-in-one creative toolkit for content creators' },
  ]
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Creator Studio</h1>
        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
          All-in-one creative toolkit for content creators
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          to="/sign-in"
          className="rounded-md bg-[hsl(var(--primary))] px-6 py-3 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
        >
          Sign In
        </Link>
        <Link
          to="/sign-up"
          className="rounded-md border border-[hsl(var(--border))] px-6 py-3 text-sm font-medium hover:bg-[hsl(var(--accent))]"
        >
          Sign Up
        </Link>
      </div>
    </main>
  )
}
