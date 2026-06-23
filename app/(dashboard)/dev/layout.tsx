// app/(dashboard)/dev/layout.tsx
import { requireRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LayoutDashboard, CheckSquare, FolderKanban, MessageSquare } from 'lucide-react'
import { UserRole } from '@prisma/client'

const NAV_ITEMS = [
  { label: 'My Tasks', href: '/dev', icon: CheckSquare },
  { label: 'Projects', href: '/dev/projects', icon: FolderKanban },
  { label: 'Updates', href: '/dev/updates', icon: MessageSquare },
]

export default async function DevLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.DEVELOPER])
  return (
    <DashboardLayout navItems={NAV_ITEMS} portalName="Developer">
      {children}
    </DashboardLayout>
  )
}
