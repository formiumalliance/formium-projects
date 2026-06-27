export const dynamic = 'force-dynamic'
// app/api/proposals/route.ts — FR-001: Standalone proposals (no project required)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'
import { LeadSource } from '@prisma/client'

const CreateProposalSchema = z.object({
  title:           z.string().min(2).max(200),
  amount:          z.number().positive(),
  currency:        z.string().default('INR'),
  validUntil:      z.string().optional(),
  notes:           z.string().optional(),
  // FR-001: client fields (no project needed)
  clientName:      z.string().optional(),
  clientEmail:     z.string().email().optional().or(z.literal('')),
  clientPhone:     z.string().optional(),
  companyName:     z.string().optional(),
  // FR-003: lead source
  leadSource:      z.nativeEnum(LeadSource).optional(),
  contactSphereId: z.string().optional(),
  // optional: link to existing project
  projectId:       z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page   = parseInt(searchParams.get('page') || '1')
    const limit  = parseInt(searchParams.get('limit') || '50')

    const proposals = await prisma.proposal.findMany({
      where: {
        ...(status ? { status } : {}),
        createdById: session.user.id,
      },
      include: {
        project:       { select: { id: true, name: true, slug: true } },
        contactSphere: { select: { id: true, contactName: true, companyName: true } },
        createdBy:     { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
    })

    const total = await prisma.proposal.count({ where: { createdById: session.user.id } })

    return NextResponse.json({ data: proposals, total, page, limit })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body   = await req.json()
    const parsed = CreateProposalSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const data = parsed.data

    // Validate projectId if provided
    if (data.projectId) {
      const project = await prisma.project.findUnique({ where: { id: data.projectId } })
      if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 400 })
    }

    const proposal = await prisma.proposal.create({
      data: {
        title:           data.title,
        amount:          data.amount,
        currency:        data.currency,
        validUntil:      data.validUntil ? new Date(data.validUntil) : null,
        notes:           data.notes,
        clientName:      data.clientName,
        clientEmail:     data.clientEmail || null,
        clientPhone:     data.clientPhone,
        companyName:     data.companyName,
        leadSource:      data.leadSource,
        contactSphereId: data.contactSphereId || null,
        projectId:       data.projectId || null,
        createdById:     session.user.id,
        status:          'DRAFT',
      },
      include: {
        project:       { select: { id: true, name: true } },
        contactSphere: { select: { id: true, contactName: true } },
      },
    })

    return NextResponse.json({ data: proposal }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
