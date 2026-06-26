export const dynamic = 'force-dynamic'
// app/api/files/[fileId]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@supabase/supabase-js'
import { handleApiError } from '@/lib/utils/api-error'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const file = await prisma.fileAttachment.findUnique({
    where: { id: params.fileId },
  })

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    // Refresh signed URL (1 hour for download)
    const { data, error } = await supabase.storage
    .from(process.env.STORAGE_BUCKET || 'formium-files')
    .createSignedUrl(file.key, 3600, {
      download: file.originalName,
    })

    if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 })
  }

    // Update stored URL
    await prisma.fileAttachment.update({
    where: { id: file.id },
    data: { url: data.signedUrl },
  })

    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    return handleApiError(error)
  }
}
