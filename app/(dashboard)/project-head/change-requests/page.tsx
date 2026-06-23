// app/(dashboard)/project-head/change-requests/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
// Reuse the same client component from super-admin
import PMChangeRequestsClient from '@/app/(dashboard)/pm/change-requests/PMChangeRequestsClient'

export default async function ProjectHeadChangeRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string; projectId?: string }
}) {
  await requireRole([UserRole.PROJECT_HEAD, UserRole.SUPER_ADMIN])

  const changeRequests = await prisma.changeRequest.findMany({
    where: {
      project: { isArchived: false },
      ...(searchParams.status ? { status: searchParams.status as import('@prisma/client').ChangeRequestStatus } : {}),
      ...(searchParams.projectId ? { projectId: searchParams.projectId }        : {}),
    },
    include: {
      project: {
        select: {
          id: true, name: true,
          projectHead: { select: { name: true } },
        },
      },
      decidedBy: { select: { name: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  const projects = await prisma.project.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <PMChangeRequestsClient
      changeRequests={changeRequests}
      projects={projects}
      filters={searchParams}
      canDecide={true}  // Project Head CAN decide
    />
  )
}
