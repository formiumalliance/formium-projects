export const dynamic = 'force-dynamic'
// app/(dashboard)/project-head/projects/[id]/page.tsx
import { requireRole } from '@/lib/auth/session'
import { UserRole } from '@prisma/client'
import ProjectDetailShared from '@/app/(dashboard)/pm/projects/[id]/ProjectDetailShared'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  await requireRole([UserRole.PROJECT_HEAD, UserRole.SUPER_ADMIN])
  return <ProjectDetailShared projectId={params.id} portalBase="/project-head" />
}
