// app/(dashboard)/project-head/layout.tsx
import { requireRole } from '@/lib/auth/session'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { UserRole } from '@prisma/client'

export default async function ProjectHeadLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.PROJECT_HEAD, UserRole.SUPER_ADMIN])
  return (
    <DashboardLayout portalKey="project-head" portalName="Project Head">
      {children}
    </DashboardLayout>
  )
}
