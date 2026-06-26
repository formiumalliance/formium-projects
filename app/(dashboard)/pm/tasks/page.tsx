export const dynamic = 'force-dynamic'
// app/(dashboard)/pm/tasks/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import PMTasksClient from './PMTasksClient'

export default async function PMTasksPage({
  searchParams,
}: {
  searchParams: { status?: string; phase?: string; assigneeId?: string; projectId?: string }
}) {
  const session = await requireRole([
    UserRole.PROJECT_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD,
  ])

  const isAdmin = [UserRole.SUPER_ADMIN as string, UserRole.PROJECT_HEAD as string].includes(session.user.role)

  const where: any = {
    project: {
      isArchived: false,
      ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
    },
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.phase ? { phase: searchParams.phase } : {}),
    ...(searchParams.assigneeId ? { assigneeId: searchParams.assigneeId } : {}),
    ...(searchParams.projectId ? { projectId: searchParams.projectId } : {}),
  }

  const [tasks, projects, developers] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    }),
    prisma.project.findMany({
      where: {
        isArchived: false,
        ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: UserRole.DEVELOPER, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <PMTasksClient
      tasks={tasks}
      projects={projects}
      developers={developers}
      filters={searchParams}
    />
  )
}
