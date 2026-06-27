export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { handleApiError } from '@/lib/utils/api-error'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const contact = await prisma.contactSphere.update({ where: { id: params.id }, data: body })
    return NextResponse.json({ data: contact })
  } catch (err) { return handleApiError(err) }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.contactSphere.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) { return handleApiError(err) }
}
