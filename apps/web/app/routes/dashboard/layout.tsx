import { Outlet, useNavigate } from 'react-router'
import type { Route } from './+types/layout'
import { requireSession } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
import { prisma } from '@creator-studio/db/client'
import { OrganizationSwitcher } from '~/components/organization-switcher'
import { SidebarProvider } from '~/lib/sidebar-context'
import { DashboardSidebar } from '~/components/layout/dashboard-sidebar'
import { DashboardTopbar } from '~/components/layout/dashboard-topbar'
import { MobileBottomTabs } from '~/components/layout/mobile-bottom-tabs'
import { MobileSidebarSheet } from '~/components/layout/mobile-sidebar-sheet'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)

  const orgMemberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    include: { organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return { user: session.user, orgMemberships }
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user, orgMemberships } = loaderData
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/')
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar
          userName={user.name}
          userEmail={user.email}
          onSignOut={handleSignOut}
          orgSwitcher={<OrganizationSwitcher memberships={orgMemberships} />}
        />
        <MobileSidebarSheet />

        <div className="flex flex-1 flex-col min-w-0">
          <DashboardTopbar />
          <main id="main-content" className="flex-1 overflow-auto pb-16 lg:pb-0" tabIndex={-1}>
            <Outlet />
          </main>
        </div>

        <MobileBottomTabs />
      </div>
    </SidebarProvider>
  )
}
