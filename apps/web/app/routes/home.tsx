import { Link } from 'react-router'
import { Image, Video, Share2, Globe, Sparkles } from 'lucide-react'
import type { Route } from './+types/home'
import { getSession } from '~/lib/auth-server'
import { Button } from '@creator-studio/ui/components/button'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Creator Studio — All-in-one Creative Toolkit' },
    { name: 'description', content: 'Design, edit, publish, and analyze content — all in one place.' },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request)
  return { isAuthenticated: !!session }
}

const features = [
  { icon: Image, title: 'Canvas Editor', desc: 'Design images with templates, shapes, and text' },
  { icon: Video, title: 'Video Editor', desc: 'Timeline editing, transitions, and export' },
  { icon: Share2, title: 'Social Management', desc: 'Schedule and publish to multiple platforms' },
  { icon: Globe, title: 'Web Crawler', desc: 'Scraping, trends, and SEO insights' },
  { icon: Sparkles, title: 'AI Tools', desc: 'Content generation and design suggestions' },
]

export default function Home({ loaderData }: Route.ComponentProps) {
  const { isAuthenticated } = loaderData

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <span className="text-xl font-bold text-primary">Creator Studio</span>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button asChild className="press-scale">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="press-scale">
                <Link to="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center lg:py-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          All-in-one creative toolkit
          <span className="block text-primary">for content creators</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Design, edit, publish, and analyze your content — all in one place.
          Stop switching between tools and start creating.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          {isAuthenticated ? (
            <Button size="lg" asChild className="press-scale">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild className="press-scale">
                <Link to="/sign-up">Start Creating</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/sign-in">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="hover-lift rounded-xl border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Creator Studio &copy; {new Date().getFullYear()}
      </footer>
    </main>
  )
}
