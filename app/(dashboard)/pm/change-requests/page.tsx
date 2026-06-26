export const dynamic = 'force-dynamic'
// app/(dashboard)/pm/change-requests/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import PMChangeRequestsClient from './PMChangeRequestsClient'

export default async function PMChangeRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string; projectId?: string }
}) {
  const session = await requireRole([
    UserRole.PROJECT_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD,
  ])

  const isAdmin = [UserRole.SUPER_ADMIN as string, UserRole.PROJECT_HEAD as string].includes(session.user.role)

  const changeRequests = await prisma.changeRequest.findMany({
    where: {
      project: {
        isArchived: false,
        ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
        ...(searchParams.projectId ? { id: searchParams.projectId } : {}),
      },
      ...(searchParams.status ? { status: searchParams.status as import('@prisma/client').ChangeRequestStatus } : {}),
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectHead: { select: { name: true } },
        },
      },
      decidedBy: { select: { name: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  const projects = await prisma.project.findMany({
    where: {
      isArchived: false,
      ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <PMChangeRequestsClient
      changeRequests={changeRequests}
      projects={projects}
      filters={searchParams}
      canDecide={isAdmin}
    />
  )
}
