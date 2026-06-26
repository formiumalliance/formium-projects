export const dynamic = 'force-dynamic'
// app/(dashboard)/pm/updates/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import PMUpdatesClient from './PMUpdatesClient'

export default async function PMUpdatesPage({
  searchParams,
}: {
  searchParams: { projectId?: string; published?: string }
}) {
  const session = await requireRole([
    UserRole.PROJECT_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD,
  ])

  const isAdmin = [UserRole.SUPER_ADMIN as string, UserRole.PROJECT_HEAD as string].includes(session.user.role)

  const updates = await prisma.projectUpdate.findMany({
    where: {
      project: {
        isArchived: false,
        ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
        ...(searchParams.projectId ? { id: searchParams.projectId } : {}),
      },
      ...(searchParams.published === 'true' ? { isPublished: true }
        : searchParams.published === 'false' ? { isPublished: false }
        : {}),
    },
    include: {
      project: { select: { id: true, name: true } },
      publishedBy: { select: { id: true, name: true } },
      _count: { select: { comments: true, feedbackItems: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })

  const projects = await prisma.project.findMany({
    where: {
      isArchived: false,
      ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return <PMUpdatesClient updates={updates} projects={projects} filters={searchParams} />
}
