import { NavLink, Link } from 'react-router'
import { X, Image, Video, Share2, Globe, Sparkles, Building2, LayoutDashboard, Webhook, Key, Puzzle } from 'lucide-react'
import { useSidebar } from '~/lib/sidebar-context'
import { cn } from '@creator-studio/ui/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/canvas', label: 'Canvas', icon: Image },
  { to: '/dashboard/video', label: 'Video', icon: Video },
  { to: '/dashboard/social', label: 'Social', icon: Share2 },
  { to: '/dashboard/crawler', label: 'Crawler', icon: Globe },
  { to: '/dashboard/ai', label: 'AI Tools', icon: Sparkles },
  { to: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  { to: '/dashboard/plugins', label: 'Plugins', icon: Puzzle },
  { to: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
]

export function MobileSidebarSheet() {
  const { mobileOpen, setMobileOpen } = useSidebar()

  if (!mobileOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
      <div className="fixed inset-y-0 left-0 w-72 bg-sidebar-background shadow-xl">
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/dashboard" className="text-lg font-bold text-sidebar-foreground" viewTransition>
            Creator Studio
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              viewTransition
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
