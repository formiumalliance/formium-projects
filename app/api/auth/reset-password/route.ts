export const dynamic = 'force-dynamic'
// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { handleApiError } from '@/lib/utils/api-error'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }
    if ((password as string).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Reset link is invalid or has expired.' },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'This reset link has already been used.' },
        { status: 400 }
      )
    }

    if (new Date(resetToken.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data:  { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data:  { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
