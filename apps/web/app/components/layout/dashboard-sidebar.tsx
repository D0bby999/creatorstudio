import { NavLink, Link } from 'react-router'
import {
  Image,
  Video,
  Share2,
  Globe,
  Sparkles,
  Building2,
  LayoutDashboard,
  LogOut,
  Webhook,
  Key,
  Puzzle,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
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

interface DashboardSidebarProps {
  userName: string
  userEmail: string
  onSignOut: () => void
  orgSwitcher?: React.ReactNode
}

export function DashboardSidebar({ userName, userEmail, onSignOut, orgSwitcher }: DashboardSidebarProps) {
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        'hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar-background transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        {!collapsed && (
          <Link to="/dashboard" className="text-lg font-bold text-sidebar-foreground truncate" viewTransition>
            Creator Studio
          </Link>
        )}
        <button
          onClick={toggle}
          className={cn(
            'rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed ? 'mx-auto' : 'ml-auto',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && orgSwitcher && (
        <div className="border-b border-sidebar-border px-3 py-2">{orgSwitcher}</div>
      )}

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            viewTransition
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          )}
          <button
            onClick={onSignOut}
            className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
