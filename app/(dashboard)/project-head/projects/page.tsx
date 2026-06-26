export const dynamic = 'force-dynamic'
// app/(dashboard)/project-head/projects/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import PMProjectsClient from '@/app/(dashboard)/pm/projects/PMProjectsClient'

export default async function ProjectHeadProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; health?: string; search?: string; page?: string }
}) {
  await requireRole([UserRole.PROJECT_HEAD, UserRole.SUPER_ADMIN])

  const page = parseInt(searchParams.page || '1')
  const pageSize = 20

  const where: any = {
    isArchived: false,
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.health  ? { health:  searchParams.health  } : {}),
    ...(searchParams.search
      ? { name: { contains: searchParams.search, mode: 'insensitive' } }
      : {}),
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        projectManager: { select: { name: true, avatar: true } },
        clientProfile:  { include: { user: { select: { name: true } } } },
        _count:         { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ])

  const projectsWithStats = await Promise.all(
    projects.map(async p => {
      const doneTasks = await prisma.task.count({
        where: { projectId: p.id, status: { in: ['DONE', 'APPROVED'] } },
      })
      return { ...p, doneTasks }
    })
  )

  return (
    <PMProjectsClient
      projects={projectsWithStats}
      total={total}
      page={page}
      pageSize={pageSize}
      isAdmin={true}
    />
  )
}
