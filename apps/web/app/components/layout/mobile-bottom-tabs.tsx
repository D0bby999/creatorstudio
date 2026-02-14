import { NavLink } from 'react-router'
import { LayoutDashboard, Image, Share2, Globe, Sparkles } from 'lucide-react'
import { cn } from '@creator-studio/ui/lib/utils'

const tabs = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/dashboard/canvas', label: 'Canvas', icon: Image },
  { to: '/dashboard/social', label: 'Social', icon: Share2 },
  { to: '/dashboard/crawler', label: 'Crawler', icon: Globe },
  { to: '/dashboard/ai', label: 'AI', icon: Sparkles },
]

export function MobileBottomTabs() {
  return (
    <nav
      aria-label="Primary tools"
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          viewTransition
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium min-h-[44px] min-w-[44px]',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
