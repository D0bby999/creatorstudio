// Organization switcher — dropdown in sidebar to navigate between orgs

import { useNavigate } from 'react-router'
import { Building2, ChevronsUpDown } from 'lucide-react'

interface OrgMembership {
  role: string
  organization: { id: string; name: string; slug: string }
}

interface OrganizationSwitcherProps {
  memberships: OrgMembership[]
  currentOrgId?: string
}

export function OrganizationSwitcher({ memberships, currentOrgId }: OrganizationSwitcherProps) {
  const navigate = useNavigate()

  if (memberships.length === 0) return null

  const current = memberships.find((m) => m.organization.id === currentOrgId)

  return (
    <div className="px-3 pb-2">
      <button
        onClick={() => navigate('/dashboard/organizations')}
        className="flex w-full items-center gap-2 rounded-md border border-[hsl(var(--sidebar-border))] px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(var(--sidebar-accent))]"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          {current ? current.organization.name : 'Organizations'}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>
    </div>
  )
}
