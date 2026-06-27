export const dynamic = 'force-dynamic'
// app/(dashboard)/client/projects/[id]/page.tsx
import { requireClientRole } from '@/lib/auth/session'
import ProjectDetailShared from '@/app/(dashboard)/pm/projects/[id]/ProjectDetailShared'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  await requireClientRole()
  return <ProjectDetailShared projectId={params.id} portalBase="/client" />
}
