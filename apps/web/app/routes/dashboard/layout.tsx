import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import type { Route } from './+types/layout'
import { requireSession } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
import {
  Image,
  Video,
  Share2,
  Globe,
  Sparkles,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  return { user: session.user }
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/canvas', label: 'Canvas', icon: Image },
  { to: '/dashboard/video', label: 'Video', icon: Video },
  { to: '/dashboard/social', label: 'Social', icon: Share2 },
  { to: '/dashboard/crawler', label: 'Crawler', icon: Globe },
  { to: '/dashboard/ai', label: 'AI Tools', icon: Sparkles },
]

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/')
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))]">
        <div className="flex h-14 items-center border-b border-[hsl(var(--sidebar-border))] px-4">
          <Link to="/dashboard" className="text-lg font-bold">
            Creator Studio
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]'
                    : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-md p-2 hover:bg-[hsl(var(--sidebar-accent))]"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
