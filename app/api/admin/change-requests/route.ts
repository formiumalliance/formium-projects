export const dynamic = 'force-dynamic'
// app/api/admin/change-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import { handleApiError } from '@/lib/utils/api-error'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD]
    if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')

    const changeRequests = await prisma.changeRequest.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(projectId ? { projectId } : {}),
    },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      decidedBy: { select: { name: true } },
    },
    orderBy: [
      { status: 'asc' }, // PENDING first
      { createdAt: 'desc' },
    ],
  })

    return NextResponse.json({ data: changeRequests })
  } catch (error) {
    return handleApiError(error)
  }
}
