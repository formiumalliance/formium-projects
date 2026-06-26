export const dynamic = 'force-dynamic'
// app/api/projects/[id]/folders/route.ts
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

    const userRole = session.user.role as UserRole
    const isClient =
  userRole === UserRole.CLIENT_ADMIN ||
  userRole === UserRole.CLIENT_MEMBER

    const folders = await prisma.projectFolder.findMany({
    where: {
      projectId: params.id,
      parentId: null,
      ...(isClient ? { isClientVisible: true } : {}),
    },
    include: {
      files: {
        orderBy: { createdAt: 'desc' },
      },
      children: {
        include: { files: { orderBy: { createdAt: 'desc' } } },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

    return NextResponse.json({ data: folders })
  } catch (error) {
    return handleApiError(error)
  }
}

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().optional(),
  isCore: z.boolean().default(false),
  isClientVisible: z.boolean().default(true),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    // Only internal team can create folders
    if (
  userRole === UserRole.CLIENT_ADMIN ||
  userRole === UserRole.CLIENT_MEMBER
) {
    return NextResponse.json({ error: 'Clients cannot create folders' }, { status: 403 })
  }

    const body = await req.json()
    const parsed = CreateFolderSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const folder = await prisma.projectFolder.create({
    data: {
      projectId: params.id,
      ...parsed.data,
    },
  })

    return NextResponse.json({ data: folder }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folderId')
    if (!folderId) return NextResponse.json({ error: 'folderId required' }, { status: 400 })

    const folder = await prisma.projectFolder.findFirst({
    where: { id: folderId, projectId: params.id },
  })
    if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (folder.isCore) return NextResponse.json({ error: 'Core folders cannot be deleted' }, { status: 403 })

    await prisma.projectFolder.delete({ where: { id: folderId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
