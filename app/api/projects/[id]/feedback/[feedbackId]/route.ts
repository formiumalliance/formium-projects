// app/api/projects/[id]/feedback/[feedbackId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { handleApiError } from '@/lib/utils/api-error'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; feedbackId: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { status, assigneeId } = body

    const item = await prisma.feedbackItem.update({
    where: { id: params.feedbackId, projectId: params.id },
    data: {
      status: status ?? undefined,
      assigneeId: assigneeId ?? undefined,
      resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true } },
    },
  })

    return NextResponse.json({ data: item })
  } catch (error) {
    return handleApiError(error)
  }
}
