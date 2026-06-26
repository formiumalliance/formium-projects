export const dynamic = 'force-dynamic'
// app/(dashboard)/client/updates/page.tsx
import { requireClientRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import ClientUpdatesClient from './ClientUpdatesClient'

export default async function ClientUpdatesPage() {
  const session = await requireClientRole()

  const updates = await prisma.projectUpdate.findMany({
    where: {
      isPublished: true,
      project: { clientProfile: { userId: session.user.id } },
    },
    include: {
      publishedBy: { select: { id: true, name: true, avatar: true } },
      project: { select: { id: true, name: true, slug: true } },
      attachments: true,
      comments: {
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true, avatar: true, role: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { feedbackItems: true } },
    },
    orderBy: { publishedAt: 'desc' },
  })

  const serializedUpdates = updates.map((update) => ({
    ...update,
    publishedAt: update.publishedAt?.toISOString() ?? undefined,
  }))

  return (
    <ClientUpdatesClient
      updates={serializedUpdates}
      userId={session.user.id}
    />
  )
}
