export const dynamic = 'force-dynamic'
// app/(dashboard)/pm/projects/[id]/page.tsx
import { requireRole } from '@/lib/auth/session'
import { UserRole } from '@prisma/client'
import ProjectDetailShared from './ProjectDetailShared'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  await requireRole([
    UserRole.PROJECT_MANAGER,
    UserRole.SUPER_ADMIN,
    UserRole.PROJECT_HEAD,
    UserRole.BUSINESS_GROWTH_MANAGER,
  ])
  return <ProjectDetailShared projectId={params.id} portalBase="/pm" />
}
