// app/(dashboard)/project-head/handovers/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import PMHandoverClient from '@/app/(dashboard)/pm/handover/PMHandoverClient'

export default async function ProjectHeadHandoversPage() {
  await requireRole([UserRole.PROJECT_HEAD, UserRole.SUPER_ADMIN])

  const projects = await prisma.project.findMany({
    where: {
      isArchived: false,
      status: { in: ['ACTIVE', 'REVIEW', 'COMPLETED'] },
    },
    include: {
      handover: true,
      clientProfile: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return <PMHandoverClient projects={projects} />
}
