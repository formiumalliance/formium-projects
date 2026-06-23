// app/api/projects/[id]/requirements/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { updateProjectHealth } from '@/lib/utils/project-health'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const requirements = await prisma.requirement.findMany({
    where: { projectId: params.id },
    orderBy: { sortOrder: 'asc' },
  })

    return NextResponse.json({ data: requirements })
  } catch (error) {
    return handleApiError(error)
  }
}

const CreateRequirementSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  isRequired: z.boolean().default(true),
  dueDate: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if ([UserRole.CLIENT_ADMIN, UserRole.CLIENT_MEMBER, UserRole.DEVELOPER].includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const body = await req.json()
    const parsed = CreateRequirementSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const count = await prisma.requirement.count({ where: { projectId: params.id } })

    const req2 = await prisma.requirement.create({
    data: {
      projectId: params.id,
      title: parsed.data.title,
      description: parsed.data.description,
      isRequired: parsed.data.isRequired,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      sortOrder: count,
    },
  })

    return NextResponse.json({ data: req2 }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH — mark requirement as received / update
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { requirementId, isReceived, notes } = body

    const requirement = await prisma.requirement.update({
    where: { id: requirementId, projectId: params.id },
    data: {
      isReceived: isReceived ?? undefined,
      receivedAt: isReceived ? new Date() : undefined,
      notes: notes ?? undefined,
    },
  })

    // Re-assess project health when requirements change
    await updateProjectHealth(params.id)

    // If all required requirements received, resume timeline if paused
    const pendingRequired = await prisma.requirement.count({
    where: { projectId: params.id, isRequired: true, isReceived: false },
  })

    if (pendingRequired === 0) {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { timelinePaused: true },
    })
    if (project?.timelinePaused) {
      await prisma.project.update({
        where: { id: params.id },
        data: {
          timelinePaused: false,
          timelinePausedAt: null,
          timelinePauseReason: null,
        },
      })
    }
  }

    return NextResponse.json({ data: requirement })
  } catch (error) {
    return handleApiError(error)
  }
}
