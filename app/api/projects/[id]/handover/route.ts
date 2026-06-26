export const dynamic = 'force-dynamic'
// app/api/projects/[id]/handover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { generateHandoverPackage } from '@/lib/utils/handover'
import { notifyHandoverReady } from '@/lib/notifications/service'
import { sendHandoverReadyEmail } from '@/lib/email/mailer'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const HandoverSchema = z.object({
  liveUrl: z.string().url().optional(),
  stagingUrl: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
  deploymentPlatform: z.string().optional(),
  deploymentNotes: z.string().optional(),
  credentialsNotes: z.string().optional(),
  maintenanceNotes: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const handover = await prisma.handover.findUnique({
    where: { projectId: params.id },
  })

    return NextResponse.json({ data: handover })
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
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const body = await req.json()
    const parsed = HandoverSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const handover = await prisma.handover.upsert({
    where: { projectId: params.id },
    create: { projectId: params.id, ...parsed.data, status: 'PREPARING' },
    update: { ...parsed.data },
  })

    return NextResponse.json({ data: handover }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// Generate the ZIP package
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'download') {
    // Both internal team and client can download
    const buffer = await generateHandoverPackage(params.id)
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { name: true, slug: true },
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project?.slug || params.id}-handover.zip"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  }

    if (action === 'mark-ready') {
    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD, UserRole.PROJECT_MANAGER]
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    await prisma.handover.update({
      where: { projectId: params.id },
      data: { status: 'READY', generatedAt: new Date() },
    })

    // Update project status
    await prisma.project.update({
      where: { id: params.id },
      data: { status: 'COMPLETED', actualEndDate: new Date() },
    })

    // Notify client
    await notifyHandoverReady(params.id)

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        clientProfile: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    if (project?.clientProfile?.user) {
      await sendHandoverReadyEmail(
        project.clientProfile.user.email,
        project.clientProfile.user.name,
        project.name,
        project.slug
      )
    }

    return NextResponse.json({ success: true })
  }

    if (action === 'acknowledge') {
    await prisma.handover.update({
      where: { projectId: params.id },
      data: { clientAcknowledgedAt: new Date(), status: 'DELIVERED', deliveredAt: new Date() },
    })

    return NextResponse.json({ success: true })
  }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}
