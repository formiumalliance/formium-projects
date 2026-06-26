export const dynamic = 'force-dynamic'
// app/api/projects/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@supabase/supabase-js'
import { UserRole, DocumentType } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { handleApiError } from '@/lib/utils/api-error'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = process.env.STORAGE_BUCKET || 'formium-files'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    const userRole = session.user.role as UserRole
    const isClient =
  userRole === UserRole.CLIENT_ADMIN ||
  userRole === UserRole.CLIENT_MEMBER
    // Clients can only see certain document types
    const clientVisibleTypes: DocumentType[] = ['AGREEMENT', 'INVOICE', 'RECEIPT', 'HANDOVER']

    const documents = await prisma.projectDocument.findMany({
    where: {
      projectId: params.id,
      isLatest: true,
      ...(type ? { type: type as DocumentType } : {}),
      ...(isClient ? { type: { in: clientVisibleTypes } } : {}),
    },
    include: {
      attachments: true,
    },
    orderBy: { createdAt: 'desc' },
  })

    return NextResponse.json({ data: documents })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    if (
  userRole === UserRole.CLIENT_ADMIN ||
  userRole === UserRole.CLIENT_MEMBER ||
  userRole === UserRole.DEVELOPER
) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const formData = await req.formData()
    const file    = formData.get('file') as File | null
    const type    = formData.get('type') as DocumentType | null
    const title   = formData.get('title') as string | null

    if (!file || !type || !title) {
    return NextResponse.json({ error: 'file, type and title are required' }, { status: 400 })
  }

    if (!Object.values(DocumentType).includes(type)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
  }

    // Mark old versions as not latest
    await prisma.projectDocument.updateMany({
    where: { projectId: params.id, type, isLatest: true },
    data: { isLatest: false },
  })

    // Upload to Supabase
    const ext = file.name.split('.').pop()
    const key = `projects/${params.id}/documents/${type.toLowerCase()}/${uuidv4()}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, { contentType: file.type })

    if (uploadError) {
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
  }

    const { data: signedData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, 7 * 24 * 3600)

    // Create document record
    const document = await prisma.projectDocument.create({
    data: {
      projectId: params.id,
      type,
      title,
      isLatest: true,
      attachments: {
        create: {
          projectId: params.id,
          name: `${uuidv4()}.${ext}`,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: signedData?.signedUrl || '',
          key,
          uploadedById: session.user.id,
        },
      },
    },
    include: { attachments: true },
  })

    return NextResponse.json({ data: document }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
