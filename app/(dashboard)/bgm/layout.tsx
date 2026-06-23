// app/(dashboard)/bgm/layout.tsx
import { requireRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LayoutDashboard, FolderKanban, PlusCircle, FileText, TrendingUp } from 'lucide-react'
import { UserRole } from '@prisma/client'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/bgm', icon: LayoutDashboard },
  { label: 'All Projects', href: '/bgm/projects', icon: FolderKanban },
  { label: 'New Project', href: '/bgm/projects/new', icon: PlusCircle },
  { label: 'Proposals', href: '/bgm/proposals', icon: FileText },
  { label: 'Revenue', href: '/bgm/revenue', icon: TrendingUp },
]

export default async function BGMLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.BUSINESS_GROWTH_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD])
  return (
    <DashboardLayout navItems={NAV_ITEMS} portalName="Growth Manager">
      {children}
    </DashboardLayout>
  )
}
