import { useLocation, Link } from 'react-router'
import { Menu, ChevronRight } from 'lucide-react'
import { useSidebar } from '~/lib/sidebar-context'
import { ThemeToggle } from '@creator-studio/ui/components/composites/theme-toggle'

function useBreadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []

  for (let i = 0; i < segments.length; i++) {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, ' ')
    crumbs.push({ label, href })
  }
  return crumbs
}

export function DashboardTopbar() {
  const { setMobileOpen } = useSidebar()
  const crumbs = useBreadcrumbs()

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-4">
      <button
        onClick={() => setMobileOpen(true)}
        className="rounded-md p-2 hover:bg-accent lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {i === crumbs.length - 1 ? (
              <span className="font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.href} className="text-muted-foreground hover:text-foreground" viewTransition>
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
