import { Link } from 'react-router'
import { Image, Video, Share2, Globe, Sparkles } from 'lucide-react'

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
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-[hsl(var(--muted-foreground))]">
        Choose a tool to get started
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ to, label, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-lg border border-[hsl(var(--border))] p-6 transition-colors hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]"
          >
            <Icon className="h-8 w-8 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]" />
            <h2 className="mt-4 font-semibold">{label}</h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
