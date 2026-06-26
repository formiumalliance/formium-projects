// app/(dashboard)/dev/layout.tsx
import { requireRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { UserRole } from '@prisma/client'

export default async function DevLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.DEVELOPER])
  return (
    <DashboardLayout portalKey="dev" portalName="Developer">
      {children}
    </DashboardLayout>
  )
}
