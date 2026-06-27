export const dynamic = 'force-dynamic'
// app/api/proposals/[id]/route.ts — FR-004: Accept & convert proposal to project
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { handleApiError } from '@/lib/utils/api-error'
import slugify from '@/lib/utils/slugify'
import { ProjectType } from '@prisma/client'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: { project: true, contactSphere: true, createdBy: { select: { name: true } } },
    })
    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: proposal })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { action, ...updateData } = body

    // FR-004: Convert accepted proposal to a project
    if (action === 'convert_to_project') {
      const proposal = await prisma.proposal.findUnique({
        where: { id: params.id },
        include: { contactSphere: true },
      })
      if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
      if (proposal.projectId) return NextResponse.json({ error: 'Already linked to a project' }, { status: 400 })

      const name = proposal.companyName
        ? proposal.companyName + ' — ' + proposal.title
        : proposal.clientName + ' — ' + proposal.title || proposal.title

      const slug = await slugify(name)

      const project = await prisma.project.create({
        data: {
          name,
          slug,
          type: ProjectType.BUSINESS_WEBSITE, // default; PM can change
          proposedBudget: proposal.amount,
          currency: proposal.currency,
          status: 'DRAFT',
        },
      })

      // Link proposal to the new project + mark accepted
      await prisma.proposal.update({
        where: { id: params.id },
        data: {
          projectId:  project.id,
          isAccepted: true,
          acceptedAt: new Date(),
          status:     'ACCEPTED',
        },
      })

      return NextResponse.json({ data: { project, message: 'Project created from proposal' } })
    }

    // Regular update (status change, accept, etc.)
    const updated = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...(updateData.isAccepted ? { acceptedAt: new Date(), status: 'ACCEPTED' } : {}),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.proposal.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
