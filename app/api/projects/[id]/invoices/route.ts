// app/api/projects/[id]/invoices/route.ts
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

    const invoices = await prisma.invoice.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'desc' },
  })
    return NextResponse.json({ data: invoices })
  } catch (error) {
    return handleApiError(error)
  }
}

const CreateSchema = z.object({
  invoiceNumber: z.string().min(2).max(50),
  amount:        z.number().positive(),
  tax:           z.number().min(0).default(0),
  dueDate:       z.string().optional(),
  notes:         z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if ([UserRole.DEVELOPER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_MEMBER].includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const body   = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const totalAmount = parsed.data.amount + parsed.data.tax

    const invoice = await prisma.invoice.create({
    data: {
      projectId:     params.id,
      invoiceNumber: parsed.data.invoiceNumber,
      amount:        parsed.data.amount,
      tax:           parsed.data.tax,
      totalAmount,
      dueDate:       parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      notes:         parsed.data.notes,
    },
  })

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { invoiceId, isPaid } = body

    const invoice = await prisma.invoice.update({
    where: { id: invoiceId, projectId: params.id },
    data: {
      isPaid,
      paidAt: isPaid ? new Date() : undefined,
    },
  })

    // If advance payment, record on project
    if (isPaid) {
    const existingAdvance = await prisma.project.findUnique({
      where: { id: params.id },
      select: { advanceAmount: true },
    })
    if (!existingAdvance?.advanceAmount) {
      await prisma.project.update({
        where: { id: params.id },
        data: { advanceAmount: invoice.totalAmount, advancePaidAt: new Date() },
      })
    }
  }

    return NextResponse.json({ data: invoice })
  } catch (error) {
    return handleApiError(error)
  }
}
