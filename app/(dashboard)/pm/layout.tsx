// app/(dashboard)/pm/layout.tsx
import { requireRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { UserRole } from '@prisma/client'

export default async function PMLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.PROJECT_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD])
  return (
    <DashboardLayout portalKey="pm" portalName="PM Portal">
      {children}
    </DashboardLayout>
  )
}
