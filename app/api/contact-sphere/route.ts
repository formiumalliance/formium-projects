export const dynamic = 'force-dynamic'
// app/api/contact-sphere/route.ts — FR-002: Contact Sphere module
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error'

const Schema = z.object({
  contactName:  z.string().min(1).max(100),
  companyName:  z.string().optional(),
  category:     z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().email().optional().or(z.literal('')),
  notes:        z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    const contacts = await prisma.contactSphere.findMany({
      where: search ? {
        OR: [
          { contactName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { email:       { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      include: {
        _count: { select: { proposals: true } },
        proposals: {
          select: { amount: true, isAccepted: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute total business generated per contact
    const enriched = contacts.map(c => ({
      ...c,
      totalProposals: c._count.proposals,
      acceptedProposals: c.proposals.filter(p => p.isAccepted).length,
      totalBusinessGenerated: c.proposals
        .filter(p => p.isAccepted)
        .reduce((sum, p) => sum + p.amount, 0),
    }))

    return NextResponse.json({ data: enriched })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const contact = await prisma.contactSphere.create({ data: parsed.data })
    return NextResponse.json({ data: contact }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
