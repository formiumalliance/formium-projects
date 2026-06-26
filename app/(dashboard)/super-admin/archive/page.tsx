export const dynamic = 'force-dynamic'
// app/(dashboard)/super-admin/archive/page.tsx
import { requireAdminRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import SuperAdminArchiveClient from './SuperAdminArchiveClient'

export default async function SuperAdminArchivePage() {
  await requireAdminRole()

  const archived = await prisma.project.findMany({
    where: { isArchived: true },
    include: {
      projectManager: { select: { name: true } },
      clientProfile:  { include: { user: { select: { name: true } } } },
      _count:         { select: { tasks: true, documents: true } },
    },
    orderBy: { archivedAt: 'desc' },
  })

  return <SuperAdminArchiveClient projects={archived} />
}
