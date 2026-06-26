export const dynamic = 'force-dynamic'
// app/api/admin/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import { handleApiError } from '@/lib/utils/api-error'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if (

  userRole !== UserRole.SUPER_ADMIN &&

  userRole !== UserRole.PROJECT_HEAD

) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const body = await req.json()
    const { isActive, name, description } = body

    const template = await prisma.projectTemplate.update({
    where: { id: params.id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(name        && { name }),
      ...(description && { description }),
    },
  })

    return NextResponse.json({ data: template })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Only Super Admins can delete templates' }, { status: 403 })
  }

    await prisma.projectTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
