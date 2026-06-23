// app/(dashboard)/dev/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import { TaskStatusBadge, PriorityBadge } from '@/components/projects/HealthBadge'
import Link from 'next/link'
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react'
import DevTasksClient from './DevTasksClient'

export default async function DevDashboardPage() {
  const session = await requireRole([UserRole.DEVELOPER])

  const tasks = await prisma.task.findMany({
    where: { assigneeId: session.user.id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          projectManagerId: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
  })

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    inReview: tasks.filter(t => t.status === 'IN_REVIEW').length,
    overdue: tasks.filter(t =>
      t.dueDate && t.dueDate < new Date() && !['DONE', 'APPROVED'].includes(t.status)
    ).length,
    done: tasks.filter(t => ['DONE', 'APPROVED'].includes(t.status)).length,
  }

  return <DevTasksClient tasks={tasks} stats={stats} userId={session.user.id} />
}
