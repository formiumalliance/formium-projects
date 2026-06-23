// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { canAccessProject } from '@/lib/auth/session'
import { updateProjectHealth } from '@/lib/utils/project-health'
import { createAuditLog } from '@/lib/utils/audit'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canAccess = await canAccessProject(
    params.id,
    session.user.id,
    session.user.role as UserRole
    )
    if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      projectManager: { select: { id: true, name: true, avatar: true, email: true } },
      projectHead: { select: { id: true, name: true, avatar: true, email: true } },
      bgm: { select: { id: true, name: true, avatar: true, email: true } },
      clientProfile: {
        include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } },
      },
      developers: {
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
        where: { isActive: true },
      },
      tasks: {
        orderBy: [{ phase: 'asc' }, { sortOrder: 'asc' }],
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      },
      updates: {
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        include: {
          publishedBy: { select: { id: true, name: true, avatar: true } },
          _count: { select: { comments: true } },
        },
      },
      milestones: { orderBy: { sortOrder: 'asc' } },
      requirements: { orderBy: { sortOrder: 'asc' } },
      changeRequests: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      handover: true,
      _count: {
        select: {
          tasks: true,
          updates: true,
          changeRequests: true,
          documents: true,
        },
      },
    },
  })

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: project })
  } catch (error) {
    return handleApiError(error)
  }
}

const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  phase: z.string().optional(),
  health: z.string().optional(),
  projectManagerId: z.string().optional(),
  projectHeadId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  agreedBudget: z.number().optional(),
  advanceAmount: z.number().optional(),
  advancePaidAt: z.string().optional(),
  discoveryCallAt: z.string().optional(),
  discoveryCallNotes: z.string().optional(),
  timelinePaused: z.boolean().optional(),
  timelinePauseReason: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canAccess = await canAccessProject(
    params.id,
    session.user.id,
    session.user.role as UserRole
    )
    if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = UpdateProjectSchema.safeParse(body)

    if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

    const oldProject = await prisma.project.findUnique({ where: { id: params.id } })

    const updateData: any = { ...parsed.data }
    if (parsed.data.startDate) updateData.startDate = new Date(parsed.data.startDate)
    if (parsed.data.expectedEndDate) updateData.expectedEndDate = new Date(parsed.data.expectedEndDate)
    if (parsed.data.actualEndDate) updateData.actualEndDate = new Date(parsed.data.actualEndDate)
    if (parsed.data.advancePaidAt) updateData.advancePaidAt = new Date(parsed.data.advancePaidAt)
    if (parsed.data.discoveryCallAt) updateData.discoveryCallAt = new Date(parsed.data.discoveryCallAt)

    const project = await prisma.project.update({
    where: { id: params.id },
    data: updateData,
  })

    // Auto-assess health if status changed
    if (parsed.data.status === 'ACTIVE' || parsed.data.phase) {
    await updateProjectHealth(params.id)
  }

    await createAuditLog({
    userId: session.user.id,
    projectId: params.id,
    action: 'UPDATE',
    entity: 'Project',
    entityId: params.id,
    oldValues: oldProject,
    newValues: parsed.data,
  })

    return NextResponse.json({ data: project })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if (![UserRole.SUPER_ADMIN].includes(userRole)) {
    return NextResponse.json({ error: 'Only Super Admins can delete projects' }, { status: 403 })
  }

    await prisma.project.update({
    where: { id: params.id },
    data: { isArchived: true, archivedAt: new Date(), status: 'ARCHIVED' },
  })

    await createAuditLog({
    userId: session.user.id,
    projectId: params.id,
    action: 'ARCHIVE',
    entity: 'Project',
    entityId: params.id,
  })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
