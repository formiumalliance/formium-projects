export const dynamic = 'force-dynamic'
// app/(dashboard)/super-admin/projects/[id]/page.tsx
import { requireAdminRole } from '@/lib/auth/session'
import ProjectDetailShared from '@/app/(dashboard)/pm/projects/[id]/ProjectDetailShared'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  await requireAdminRole()
  return <ProjectDetailShared projectId={params.id} portalBase="/super-admin" />
}
