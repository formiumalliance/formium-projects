export const dynamic = 'force-dynamic'
// app/api/projects/[id]/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { recalculateProgress, updateProjectHealth } from '@/lib/utils/project-health'
import { createAuditLog } from '@/lib/utils/audit'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const UpdateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'DONE', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  isClientVisible: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    const body = await req.json()
    const parsed = UpdateTaskSchema.safeParse(body)

    if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

    const task = await prisma.task.findUnique({
    where: { id: params.taskId, projectId: params.id },
    include: {
      project: { select: { projectManagerId: true } },
    },
  })

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    // Permission checks
    if (userRole === UserRole.DEVELOPER) {
    // Developers can only update their own tasks
    if (task.assigneeId !== session.user.id) {
      return NextResponse.json({ error: 'You can only update your own tasks' }, { status: 403 })
    }
    // Developers cannot change due dates
    if (parsed.data.dueDate !== undefined) {
      return NextResponse.json({ error: 'Developers cannot modify due dates' }, { status: 403 })
    }
    // Developers can only move to IN_PROGRESS or IN_REVIEW
    if (parsed.data.status && !['IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'].includes(parsed.data.status)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 403 })
    }
  }

    const updateData: any = { ...parsed.data }
    if (parsed.data.dueDate) updateData.dueDate = new Date(parsed.data.dueDate)
    if (parsed.data.dueDate === null) updateData.dueDate = null

    // Set completedAt when done
    if (parsed.data.status === 'DONE' || parsed.data.status === 'APPROVED') {
    updateData.completedAt = new Date()
  }

    const updatedTask = await prisma.task.update({
    where: { id: params.taskId },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
    },
  })

    // If status changed, PM needs to review (IN_REVIEW means dev submitted)
    if (parsed.data.status === 'IN_REVIEW') {
    // Could trigger notification to PM here
  }

    // Recalculate progress when task completes
    if (['DONE', 'APPROVED'].includes(parsed.data.status || '')) {
    await recalculateProgress(params.id)
    await updateProjectHealth(params.id)
  }

    await createAuditLog({
    userId: session.user.id,
    projectId: params.id,
    action: 'UPDATE',
    entity: 'Task',
    entityId: params.taskId,
    newValues: parsed.data,
  })

    return NextResponse.json({ data: updatedTask })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if (
  userRole === UserRole.DEVELOPER ||
  userRole === UserRole.CLIENT_ADMIN ||
  userRole === UserRole.CLIENT_MEMBER
) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    await prisma.task.delete({ where: { id: params.taskId, projectId: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
