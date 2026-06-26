// app/(dashboard)/bgm/layout.tsx
import { requireRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { UserRole } from '@prisma/client'

export default async function BGMLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.BUSINESS_GROWTH_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD])
  return (
    <DashboardLayout portalKey="bgm" portalName="Growth Manager">
      {children}
    </DashboardLayout>
  )
}
