export const dynamic = 'force-dynamic'
// app/(dashboard)/client/page.tsx
import { requireClientRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getTreeConfig } from '@/types'
import { CLIENT_PHASE_LABELS, PROJECT_TYPE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import { HealthBadge, PhaseBadge } from '@/components/projects/HealthBadge'
import ClientDashboardClient from './ClientDashboardClient'

export default async function ClientDashboardPage() {
  const session = await requireClientRole()

  // Get client's active project(s)
  const projects = await prisma.project.findMany({
    where: {
      clientProfile: { userId: session.user.id },
      isArchived: false,
    },
    include: {
      projectManager: { select: { id: true, name: true, avatar: true, email: true } },
      updates: {
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        include: {
          publishedBy: { select: { name: true, avatar: true } },
          _count: { select: { comments: true } },
        },
      },
      milestones: { orderBy: { sortOrder: 'asc' } },
      requirements: { where: { isRequired: true } },
      _count: { select: { changeRequests: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const activeProject = projects.find(p => p.status === 'ACTIVE') || projects[0]

  return <ClientDashboardClient
    projects={projects}
    activeProject={activeProject || null}
    userName={session.user.name}
  />
}
