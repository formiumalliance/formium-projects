export const dynamic = 'force-dynamic'
// app/api/projects/[id]/updates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { notifyUpdatePublished } from '@/lib/notifications/service'
import { sendUpdatePublishedEmail } from '@/lib/email/mailer'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const CreateUpdateSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(10),
  phase: z.enum(['REQUIREMENTS_COLLECTION', 'PLANNING', 'BUILDING', 'REVIEW_FEEDBACK', 'LAUNCH']),
  isPublished: z.boolean().default(false),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    const isClient =
  userRole === UserRole.CLIENT_ADMIN ||
  userRole === UserRole.CLIENT_MEMBER

    const updates = await prisma.projectUpdate.findMany({
    where: {
      projectId: params.id,
      ...(isClient ? { isPublished: true } : {}),
    },
    include: {
      publishedBy: { select: { id: true, name: true, avatar: true } },
      attachments: true,
      _count: { select: { comments: true, feedbackItems: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

    return NextResponse.json({ data: updates })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD, UserRole.PROJECT_MANAGER]
    if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Only PMs can post updates' }, { status: 403 })
  }

    const body = await req.json()
    const parsed = CreateUpdateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const update = await prisma.projectUpdate.create({
    data: {
      projectId: params.id,
      publishedById: session.user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      phase: parsed.data.phase,
      isPublished: parsed.data.isPublished,
      publishedAt: parsed.data.isPublished ? new Date() : undefined,
    },
    include: {
      publishedBy: { select: { id: true, name: true, avatar: true } },
    },
  })

    if (update.isPublished) {
    await notifyUpdatePublished(update.id)

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        clientProfile: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    if (project?.clientProfile?.user) {
      await sendUpdatePublishedEmail(
        project.clientProfile.user.email,
        project.clientProfile.user.name,
        project.name,
        update.title,
        project.slug
      )
    }
  }

    return NextResponse.json({ data: update }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { updateId, isPublished, title, content } = body

    const update = await prisma.projectUpdate.update({
    where: { id: updateId, projectId: params.id },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      ...(isPublished !== undefined && {
        isPublished,
        publishedAt: isPublished ? new Date() : undefined,
      }),
    },
  })

    if (isPublished) {
    await notifyUpdatePublished(update.id)
  }

    return NextResponse.json({ data: update })
  } catch (error) {
    return handleApiError(error)
  }
}
