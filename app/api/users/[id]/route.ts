// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const UpdateProfileSchema = z.object({
  name:            z.string().min(2).max(100).optional(),
  phone:           z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword:     z.string().min(8).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = [UserRole.SUPER_ADMIN as string, UserRole.PROJECT_HEAD as string].includes(session.user.role)
    if (params.id !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
    const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, lastLoginAt: true, createdAt: true,
      clientProfile: { select: { companyName: true, website: true, industry: true } } },
  })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: user })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (params.id !== session.user.id) {
    return NextResponse.json({ error: 'You can only update your own profile' }, { status: 403 })
  }
    const body = await req.json()
    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name)  updateData.name  = parsed.data.name
    if (parsed.data.phone) updateData.phone = parsed.data.phone

    if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: params.id }, select: { passwordHash: true } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    updateData.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
  }

    const updated = await prisma.user.update({
    where: { id: params.id }, data: updateData,
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
  })
    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}
