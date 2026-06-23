// app/(dashboard)/super-admin/templates/page.tsx
import { requireAdminRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import SuperAdminTemplatesClient from './SuperAdminTemplatesClient'

export default async function SuperAdminTemplatesPage() {
  await requireAdminRole()

  const templates = await prisma.projectTemplate.findMany({
    include: {
      _count: {
        select: {
          tasks:        true,
          folders:      true,
          requirements: true,
          milestones:   true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return <SuperAdminTemplatesClient templates={templates} />
}
