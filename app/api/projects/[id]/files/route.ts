// app/api/projects/[id]/files/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { uploadLimiter } from '@/lib/utils/rate-limit'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@supabase/supabase-js'
import { UserRole } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { handleApiError } from '@/lib/utils/api-error'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = process.env.STORAGE_BUCKET || 'formium-files'
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const files = await prisma.fileAttachment.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'desc' },
  })

    return NextResponse.json({ data: files })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit uploads
    const limited = uploadLimiter(req)
    if (limited) return limited

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folderId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `File too large. Max ${process.env.MAX_FILE_SIZE_MB}MB` }, { status: 413 })
  }

    // Verify folder belongs to project (and is client-visible if client)
    if (folderId) {
    const folder = await prisma.projectFolder.findFirst({
      where: { id: folderId, projectId: params.id },
    })
    if (!folder) return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })

    const userRole = session.user.role as UserRole
    if ([UserRole.CLIENT_ADMIN, UserRole.CLIENT_MEMBER].includes(userRole) && !folder.isClientVisible) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }

    // Generate unique storage key
    const ext = file.name.split('.').pop()
    const key = `projects/${params.id}/${folderId || 'root'}/${uuidv4()}.${ext}`

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
    console.error('Supabase upload error:', uploadError)
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
  }

    // Get signed URL (1 week)
    const { data: signedData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, 7 * 24 * 3600)

    const attachment = await prisma.fileAttachment.create({
    data: {
      projectId: params.id,
      folderId: folderId || undefined,
      name: `${uuidv4()}.${ext}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: signedData?.signedUrl || '',
      key,
      uploadedById: session.user.id,
      isPublic: false,
    },
  })

    return NextResponse.json({ data: attachment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
