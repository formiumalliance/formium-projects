export const dynamic = 'force-dynamic'
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { sendWelcomeEmail } from '@/lib/email/mailer'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  companyName: z.string().optional(), // for clients
  tempPassword: z.string().min(8).optional(),
})

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as UserRole } : {}),
      ...(search ? { OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]} : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      clientProfile: { select: { companyName: true } },
      _count: {
        select: {
          projectsAsPM: true,
          developerAssignments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

    return NextResponse.json({ data: users })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
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
    const parsed = CreateUserSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const tempPassword = parsed.data.tempPassword || generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role,
      phone: parsed.data.phone,
    },
  })

    // Create client profile if client role
    if (
  parsed.data.role === UserRole.CLIENT_ADMIN ||
  parsed.data.role === UserRole.CLIENT_MEMBER
) {
    await prisma.clientProfile.create({
      data: {
        userId: user.id,
        companyName: parsed.data.companyName,
      },
    })
  }

    // Send welcome email — FIX BUG-001: don't fail user creation if email fails
    let emailSent = true
    try {
      await sendWelcomeEmail(user.email, user.name, tempPassword)
    } catch (emailError) {
      emailSent = false
      console.error('[mailer] Welcome email failed (user still created):', emailError)
    }

    return NextResponse.json({
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
      tempPassword, // Return to admin for sharing/manual delivery
      emailSent,    // Let frontend know if email was sent
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const body = await req.json()
    const { userId, isActive, role, name } = body

    const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(role && { role }),
      ...(name && { name }),
    },
  })

    return NextResponse.json({ data: updatedUser })
  } catch (error) {
    return handleApiError(error)
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
