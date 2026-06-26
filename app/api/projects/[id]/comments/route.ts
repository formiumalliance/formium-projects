export const dynamic = 'force-dynamic'
// app/api/projects/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  updateId: z.string().optional(),
  taskId: z.string().optional(),
  parentId: z.string().optional(),
  convertToFeedback: z.boolean().default(false),
  feedbackTitle: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const updateId = searchParams.get('updateId')
    const taskId = searchParams.get('taskId')

    const comments = await prisma.comment.findMany({
    where: {
      ...(updateId ? { updateId } : {}),
      ...(taskId ? { taskId } : {}),
      parentId: null, // only top-level
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      feedbackItem: { select: { id: true, status: true, title: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

    return NextResponse.json({ data: comments })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = CreateCommentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const comment = await prisma.comment.create({
    data: {
      projectId: params.id,
      userId: session.user.id,
      content: parsed.data.content,
      updateId: parsed.data.updateId,
      taskId: parsed.data.taskId,
      parentId: parsed.data.parentId,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
    },
  })

    // Convert to feedback item if requested (PM tracking client feedback)
    if (parsed.data.convertToFeedback && parsed.data.feedbackTitle) {
    await prisma.feedbackItem.create({
      data: {
        projectId: params.id,
        updateId: parsed.data.updateId,
        commentId: comment.id,
        title: parsed.data.feedbackTitle,
        description: parsed.data.content,
        status: 'OPEN',
      },
    })
  }

    // Notify PM when client comments on an update
    if (parsed.data.updateId) {
    const update = await prisma.projectUpdate.findUnique({
      where: { id: parsed.data.updateId },
      include: { project: { select: { projectManagerId: true, name: true } } },
    })

    if (update?.project.projectManagerId && update.project.projectManagerId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: update.project.projectManagerId,
          projectId: params.id,
          type: 'COMMENT_ADDED',
          title: 'New comment on update',
          body: `${session.user.name} commented on "${update.title}".`,
          actionUrl: `/pm/projects/${params.id}/updates`,
        },
      })
    }
  }

    return NextResponse.json({ data: comment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
