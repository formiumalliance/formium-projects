export const dynamic = 'force-dynamic'
// app/api/projects/[id]/change-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { notifyChangeRequestDecision } from '@/lib/notifications/service'
import { sendChangeRequestDecisionEmail } from '@/lib/email/mailer'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const CreateCRSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  type: z.enum(['REVISION', 'BUG', 'CHARGEABLE']),
  estimatedCost: z.number().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const changeRequests = await prisma.changeRequest.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'desc' },
  })

    return NextResponse.json({ data: changeRequests })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = CreateCRSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const cr = await prisma.changeRequest.create({
    data: {
      projectId: params.id,
      requestedById: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      estimatedCost: parsed.data.estimatedCost,
      status: 'PENDING',
    },
  })

    // Notify project head
    const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { projectHead: { select: { id: true } } },
  })

    if (project?.projectHead) {
    await prisma.notification.create({
      data: {
        userId: project.projectHead.id,
        projectId: params.id,
        type: 'CHANGE_REQUEST_SUBMITTED',
        title: 'Change request submitted',
        body: `"${cr.title}" requires your decision.`,
        actionUrl: `/project-head/projects/${params.id}/change-requests`,
      },
    })
  }

    return NextResponse.json({ data: cr }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Decide on change request (Project Head only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if (
  userRole !== UserRole.SUPER_ADMIN &&
  userRole !== UserRole.PROJECT_HEAD
) {
    return NextResponse.json({ error: 'Only Project Heads can decide on change requests' }, { status: 403 })
  }

    const body = await req.json()
    const { changeRequestId, status, decisionNotes } = body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

    const cr = await prisma.changeRequest.update({
    where: { id: changeRequestId, projectId: params.id },
    data: {
      status,
      decidedById: session.user.id,
      decisionNotes,
      decidedAt: new Date(),
    },
    include: {
      project: {
        include: {
          clientProfile: { include: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  })

    // Notify and email client
    await notifyChangeRequestDecision(cr.id)
    
    if (cr.project.clientProfile?.user) {
    await sendChangeRequestDecisionEmail(
      cr.project.clientProfile.user.email,
      cr.project.clientProfile.user.name,
      cr.project.name,
      cr.title,
      status as 'APPROVED' | 'REJECTED',
      decisionNotes
    )
  }

    return NextResponse.json({ data: cr })
  } catch (error) {
    return handleApiError(error)
  }
}
