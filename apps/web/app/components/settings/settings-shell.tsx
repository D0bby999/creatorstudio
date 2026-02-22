import { NavLink } from 'react-router'
import { Shield, KeyRound, Monitor, UserX } from 'lucide-react'
import { cn } from '@creator-studio/ui/lib/utils'

const settingsNav = [
  { to: '/dashboard/settings/security', label: 'Security', icon: Shield },
  { to: '/dashboard/settings/password', label: 'Password', icon: KeyRound },
  { to: '/dashboard/settings/sessions', label: 'Sessions', icon: Monitor },
  { to: '/dashboard/settings/account', label: 'Account', icon: UserX },
]

interface SettingsShellProps {
  title: string
  description: string
  children: React.ReactNode
}

export function SettingsShell({ title, description, children }: SettingsShellProps) {
  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-8">
        <nav className="flex sm:flex-col gap-1 sm:w-48 shrink-0 overflow-x-auto">
          {settingsNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
