// app/(dashboard)/client/layout.tsx
import { requireClientRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LayoutDashboard, FolderOpen, MessageSquare, GitBranch, Package, FileText } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/client', icon: LayoutDashboard },
  { label: 'My Projects', href: '/client/projects', icon: FolderOpen },
  { label: 'Updates', href: '/client/updates', icon: MessageSquare },
  { label: 'Change Requests', href: '/client/change-requests', icon: GitBranch },
  { label: 'Files', href: '/client/files', icon: FileText },
  { label: 'Handover', href: '/client/handover', icon: Package },
]

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireClientRole()
  return (
    <DashboardLayout navItems={NAV_ITEMS} portalName="Client Portal">
      {children}
    </DashboardLayout>
  )
}
