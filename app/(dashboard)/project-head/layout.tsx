// app/(dashboard)/project-head/layout.tsx
import { requireRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  LayoutDashboard, FolderKanban, Users, GitBranch,
  Package, FileText, Shield, Settings
} from 'lucide-react'
import { UserRole } from '@prisma/client'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/project-head', icon: LayoutDashboard },
  { label: 'All Projects', href: '/project-head/projects', icon: FolderKanban },
  { label: 'Team', href: '/project-head/team', icon: Users },
  { label: 'Change Requests', href: '/project-head/change-requests', icon: GitBranch },
  { label: 'Handovers', href: '/project-head/handovers', icon: Package },
  { label: 'Documents', href: '/project-head/documents', icon: FileText },
  { label: 'Templates', href: '/project-head/templates', icon: Settings },
]

export default async function ProjectHeadLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.PROJECT_HEAD, UserRole.SUPER_ADMIN])
  return (
    <DashboardLayout navItems={NAV_ITEMS} portalName="Project Head">
      {children}
    </DashboardLayout>
  )
}
