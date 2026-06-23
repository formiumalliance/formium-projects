// app/api/projects/[id]/milestones/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const milestones = await prisma.milestone.findMany({
    where: { projectId: params.id },
    orderBy: { sortOrder: 'asc' },
  })

    return NextResponse.json({ data: milestones })
  } catch (error) {
    return handleApiError(error)
  }
}

const CreateSchema = z.object({
  title: z.string().min(2).max(200),
  daysFromStart: z.number().optional(),
  dueDate: z.string().optional(),
  sortOrder: z.number().default(0),
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
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    let dueDate: Date | undefined
    if (parsed.data.dueDate) {
    dueDate = new Date(parsed.data.dueDate)
  } else if (parsed.data.daysFromStart) {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { startDate: true },
    })
    if (project?.startDate) {
      dueDate = new Date(project.startDate.getTime() + parsed.data.daysFromStart * 86400000)
    }
  }

    const count = await prisma.milestone.count({ where: { projectId: params.id } })

    const milestone = await prisma.milestone.create({
    data: {
      projectId: params.id,
      title: parsed.data.title,
      daysFromStart: parsed.data.daysFromStart || 0,
      dueDate,
      sortOrder: count,
    },
  })

    return NextResponse.json({ data: milestone }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH — mark complete / update
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if ([UserRole.CLIENT_ADMIN, UserRole.CLIENT_MEMBER, UserRole.DEVELOPER].includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const body = await req.json()
    const { milestoneId, isCompleted, title, dueDate } = body

    const milestone = await prisma.milestone.update({
    where: { id: milestoneId, projectId: params.id },
    data: {
      ...(isCompleted !== undefined && {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      }),
      ...(title     && { title }),
      ...(dueDate   && { dueDate: new Date(dueDate) }),
    },
  })

    return NextResponse.json({ data: milestone })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const milestoneId = searchParams.get('milestoneId')
    if (!milestoneId) return NextResponse.json({ error: 'milestoneId required' }, { status: 400 })

    await prisma.milestone.delete({ where: { id: milestoneId, projectId: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
