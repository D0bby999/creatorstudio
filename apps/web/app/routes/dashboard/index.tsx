import { Link } from 'react-router'
import { Image, Video, Share2, Globe, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@creator-studio/ui/components/card'

const tools = [
  {
    to: '/dashboard/canvas',
    label: 'Canvas Editor',
    description: 'Design images with templates, shapes, and text',
    icon: Image,
  },
  {
    to: '/dashboard/video',
    label: 'Video Editor',
    description: 'Timeline editing, transitions, and MP4 export',
    icon: Video,
  },
  {
    to: '/dashboard/social',
    label: 'Social Management',
    description: 'Schedule and publish to multiple platforms',
    icon: Share2,
  },
  {
    to: '/dashboard/crawler',
    label: 'Crawler & Analytics',
    description: 'Web scraping, trends, SEO insights',
    icon: Globe,
  },
  {
    to: '/dashboard/ai',
    label: 'AI Creative Tools',
    description: 'Content generation and design suggestions',
    icon: Sparkles,
  },
]

export default function DashboardIndex() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Choose a tool to get started</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ to, label, description, icon: Icon }) => (
          <Link key={to} to={to} className="group" viewTransition aria-label={`Open ${label}: ${description}`}>
            <Card className="hover-lift h-full transition-colors group-hover:border-primary">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-4 font-semibold">{label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
