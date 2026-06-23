// app/api/projects/[id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { notifyTaskAssigned } from '@/lib/notifications/service'
import { recalculateProgress } from '@/lib/utils/project-health'
import { sendTaskAssignedEmail } from '@/lib/email/mailer'
import { createAuditLog } from '@/lib/utils/audit'
import { UserRole, TaskStatus } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const CreateTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  phase: z.enum(['REQUIREMENTS_COLLECTION', 'PLANNING', 'BUILDING', 'REVIEW_FEEDBACK', 'LAUNCH']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  parentTaskId: z.string().optional(),
  sortOrder: z.number().default(0),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    const { searchParams } = new URL(req.url)
    const phase = searchParams.get('phase')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')

    const where: any = { projectId: params.id }
    if (phase) where.phase = phase
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId

    // Developers only see their tasks
    if (userRole === UserRole.DEVELOPER) {
    where.assigneeId = session.user.id
  }

    // Client can only see client-visible tasks
    if ([UserRole.CLIENT_ADMIN, UserRole.CLIENT_MEMBER].includes(userRole)) {
    where.isClientVisible = true
  }

    const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
      _count: { select: { subtasks: true, comments: true } },
    },
    orderBy: [{ phase: 'asc' }, { sortOrder: 'asc' }],
  })

    return NextResponse.json({ data: tasks })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole

    // Developers cannot create tasks
    if (userRole === UserRole.DEVELOPER) {
    return NextResponse.json({ error: 'Developers cannot create tasks' }, { status: 403 })
  }

    const body = await req.json()
    const parsed = CreateTaskSchema.safeParse(body)

    if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

    const data = parsed.data
    const task = await prisma.task.create({
    data: {
      projectId: params.id,
      creatorId: session.user.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      phase: data.phase,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      estimatedHours: data.estimatedHours,
      parentTaskId: data.parentTaskId,
      sortOrder: data.sortOrder,
      status: 'TODO',
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
    },
  })

    // Notify assignee
    if (task.assigneeId && task.assignee) {
    await notifyTaskAssigned(task.id)
    await sendTaskAssignedEmail(
      task.assignee.email,
      task.assignee.name,
      task.title,
      params.id,
      task.dueDate || undefined
    )
  }

    await createAuditLog({
    userId: session.user.id,
    projectId: params.id,
    action: 'CREATE',
    entity: 'Task',
    entityId: task.id,
    newValues: { title: task.title },
  })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// ─── TASK UPDATE ROUTE ────────────────────────────────────────────────────────
// app/api/projects/[id]/tasks/[taskId]/route.ts is handled separately below

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Bulk update (e.g. reorder)
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { tasks } = body

    if (!Array.isArray(tasks)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

    await Promise.all(
    tasks.map((t: { id: string; sortOrder: number }) =>
      prisma.task.update({
        where: { id: t.id, projectId: params.id },
        data: { sortOrder: t.sortOrder },
      })
    )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
