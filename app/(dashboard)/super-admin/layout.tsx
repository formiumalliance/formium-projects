// app/(dashboard)/super-admin/layout.tsx
import { requireAdminRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  LayoutDashboard, FolderKanban, Users, Settings,
  FileText, BarChart2, Shield, Package, GitBranch, Archive
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
  { label: 'All Projects', href: '/super-admin/projects', icon: FolderKanban },
  { label: 'Users', href: '/super-admin/users', icon: Users },
  { label: 'Templates', href: '/super-admin/templates', icon: FileText },
  { label: 'Documents', href: '/super-admin/documents', icon: FileText },
  { label: 'Change Requests', href: '/super-admin/change-requests', icon: GitBranch },
  { label: 'Handovers', href: '/super-admin/handovers', icon: Package },
  { label: 'Archive', href: '/super-admin/archive', icon: Archive },
  { label: 'Audit Log', href: '/super-admin/audit', icon: Shield },
  { label: 'Settings', href: '/super-admin/settings', icon: Settings },
]

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminRole()
  return (
    <DashboardLayout navItems={NAV_ITEMS} portalName="Super Admin">
      {children}
    </DashboardLayout>
  )
}
