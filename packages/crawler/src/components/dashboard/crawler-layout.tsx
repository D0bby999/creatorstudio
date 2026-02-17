import { Link, useLocation } from 'react-router'

interface Tab {
  label: string
  path: string
}

const tabs: Tab[] = [
  { label: 'Jobs', path: '/dashboard/crawler/jobs' },
  { label: 'Templates', path: '/dashboard/crawler/templates' },
  { label: 'Schedules', path: '/dashboard/crawler/schedules' },
  { label: 'Datasets', path: '/dashboard/crawler/datasets' },
  { label: 'Facebook', path: '/dashboard/crawler/facebook' }
]

export function CrawlerLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crawler & Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage crawl jobs, templates, schedules, and datasets
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`
                  whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors
                  ${
                    isActive(tab.path)
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Content Slot */}
        <div>{children}</div>
      </div>
    </div>
  )
}
