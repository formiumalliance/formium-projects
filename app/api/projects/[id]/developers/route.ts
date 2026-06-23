// app/api/projects/[id]/developers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import { handleApiError } from '@/lib/utils/api-error'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const developers = await prisma.projectDeveloper.findMany({
    where: { projectId: params.id, isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
    },
    orderBy: { assignedAt: 'asc' },
  })

    return NextResponse.json({ data: developers })
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
    const { userId, role: devRole } = body

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Verify user is a developer
    const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true },
  })

    if (!user || user.role !== UserRole.DEVELOPER) {
    return NextResponse.json({ error: 'User is not a developer' }, { status: 400 })
  }

    const assignment = await prisma.projectDeveloper.upsert({
    where: { projectId_userId: { projectId: params.id, userId } },
    create: { projectId: params.id, userId, role: devRole || null, isActive: true },
    update: { isActive: true, role: devRole || undefined },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
    },
  })

    return NextResponse.json({ data: assignment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD, UserRole.PROJECT_MANAGER]
    if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    await prisma.projectDeveloper.update({
    where: { projectId_userId: { projectId: params.id, userId } },
    data: { isActive: false },
  })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
