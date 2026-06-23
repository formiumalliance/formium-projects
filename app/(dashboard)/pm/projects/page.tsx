// app/(dashboard)/pm/projects/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import PMProjectsClient from './PMProjectsClient'

export default async function PMProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; health?: string; search?: string; page?: string }
}) {
  const session = await requireRole([
    UserRole.PROJECT_MANAGER,
    UserRole.SUPER_ADMIN,
    UserRole.PROJECT_HEAD,
    UserRole.BUSINESS_GROWTH_MANAGER,
  ])

  const isAdmin = [UserRole.SUPER_ADMIN as string, UserRole.PROJECT_HEAD as string].includes(session.user.role)
  const page = parseInt(searchParams.page || '1')
  const pageSize = 15

  const where: any = {
    isArchived: false,
    ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.health ? { health: searchParams.health } : {}),
    ...(searchParams.search
      ? { name: { contains: searchParams.search, mode: 'insensitive' } }
      : {}),
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        projectManager: { select: { name: true, avatar: true } },
        clientProfile: { include: { user: { select: { name: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ])

  // Get task completion counts
  const projectsWithStats = await Promise.all(
    projects.map(async (p) => {
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
      isAdmin={isAdmin}
    />
  )
}
