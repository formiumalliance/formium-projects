export const dynamic = 'force-dynamic'
// app/(dashboard)/pm/handover/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import PMHandoverClient from './PMHandoverClient'

export default async function PMHandoverPage() {
  const session = await requireRole([
    UserRole.PROJECT_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD,
  ])

  const isAdmin = [UserRole.SUPER_ADMIN as string, UserRole.PROJECT_HEAD as string].includes(session.user.role)

  const projects = await prisma.project.findMany({
    where: {
      isArchived: false,
      status: { in: ['ACTIVE', 'REVIEW', 'COMPLETED'] },
      ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
    },
    include: {
      handover: true,
      clientProfile: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return <PMHandoverClient projects={projects} />
}
