export const dynamic = 'force-dynamic'
// app/(dashboard)/pm/feedback/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import PMFeedbackClient from './PMFeedbackClient'

export default async function PMFeedbackPage() {
  const session = await requireRole([
    UserRole.PROJECT_MANAGER, UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD,
  ])

  const isAdmin = [UserRole.SUPER_ADMIN as string, UserRole.PROJECT_HEAD as string].includes(session.user.role)

  const feedbackItems = await prisma.feedbackItem.findMany({
    where: {
      project: {
        isArchived: false,
        ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
      },
    },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      comment: { include: { user: { select: { name: true, role: true } } } },
      assignee: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const developers = await prisma.user.findMany({
    where: { role: { in: [UserRole.DEVELOPER, UserRole.PROJECT_MANAGER] }, isActive: true },
    select: { id: true, name: true, role: true },
  })

  const serializedFeedbackItems = feedbackItems.map(item => ({
  ...item,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
}))

return (
  <PMFeedbackClient
    feedbackItems={serializedFeedbackItems}
    developers={developers}
  />
)
}
