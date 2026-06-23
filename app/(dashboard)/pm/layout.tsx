import { UserRole } from '@prisma/client'
// app/(dashboard)/pm/layout.tsx
import { requireRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LayoutDashboard, FolderKanban, CheckSquare, MessageSquare, GitBranch, Users, FileText, Package } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/pm', icon: LayoutDashboard },
  { label: 'Projects', href: '/pm/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/pm/tasks', icon: CheckSquare },
  { label: 'Updates', href: '/pm/updates', icon: MessageSquare },
  { label: 'Change Requests', href: '/pm/change-requests', icon: GitBranch },
  { label: 'Feedback', href: '/pm/feedback', icon: MessageSquare },
  { label: 'Documents', href: '/pm/documents', icon: FileText },
  { label: 'Handover', href: '/pm/handover', icon: Package },
]

export default async function PMLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.PROJECT_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD])
  return (
    <DashboardLayout navItems={NAV_ITEMS} portalName="PM Portal">
      {children}
    </DashboardLayout>
  )
}
