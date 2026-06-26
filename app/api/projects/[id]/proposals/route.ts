export const dynamic = 'force-dynamic'
// app/api/projects/[id]/proposals/route.ts
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

    const proposals = await prisma.proposal.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'desc' },
  })

    return NextResponse.json({ data: proposals })
  } catch (error) {
    return handleApiError(error)
  }
}

const CreateSchema = z.object({
  title:       z.string().min(2).max(200),
  amount:      z.number().positive(),
  validUntil:  z.string().optional(),
  notes:       z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if (
  userRole === UserRole.DEVELOPER ||
  userRole === UserRole.CLIENT_ADMIN ||
  userRole === UserRole.CLIENT_MEMBER
) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const body   = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const proposal = await prisma.proposal.create({
    data: {
      projectId:  params.id,
      title:      parsed.data.title,
      amount:     parsed.data.amount,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
      notes:      parsed.data.notes,
    },
  })

    // Update project proposed budget
    await prisma.project.update({
    where: { id: params.id },
    data:  { proposedBudget: parsed.data.amount },
  })

    return NextResponse.json({ data: proposal }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { proposalId, isAccepted } = body

    const proposal = await prisma.proposal.update({
    where: { id: proposalId, projectId: params.id },
    data: {
      isAccepted,
      acceptedAt: isAccepted ? new Date() : undefined,
    },
  })

    // If accepted, also update project agreed budget and advance to AWAITING_PAYMENT
    if (isAccepted) {
    await prisma.project.update({
      where: { id: params.id },
      data: {
        agreedBudget: proposal.amount,
        status: 'AWAITING_PAYMENT',
      },
    })
  }

    return NextResponse.json({ data: proposal })
  } catch (error) {
    return handleApiError(error)
  }
}
