export const dynamic = 'force-dynamic'
// app/api/admin/branding/route.ts — FR-005: Branding management
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { UserRole } from '@prisma/client'
import { handleApiError } from '@/lib/utils/api-error'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const BRANDING_DIR = join(process.cwd(), 'public', 'branding')

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Return current branding paths (check if files exist)
    const { existsSync } = require('fs')
    return NextResponse.json({
      logoUrl:    existsSync(join(BRANDING_DIR, 'logo.png'))    ? '/branding/logo.png'    : null,
      faviconUrl: existsSync(join(BRANDING_DIR, 'favicon.ico')) ? '/branding/favicon.ico' : null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== UserRole.SUPER_ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await req.formData()
    const type     = formData.get('type') as string   // 'logo' or 'favicon'
    const file     = formData.get('file') as File | null

    if (!file || !type) return NextResponse.json({ error: 'File and type are required' }, { status: 400 })

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG, JPG, SVG, and ICO files are allowed' }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 2MB' }, { status: 400 })
    }

    await mkdir(BRANDING_DIR, { recursive: true })

    const ext      = file.name.split('.').pop() || 'png'
    const filename = type === 'logo' ? `logo.${ext}` : `favicon.ico`
    const bytes    = await file.arrayBuffer()
    await writeFile(join(BRANDING_DIR, filename), Buffer.from(bytes))

    const url = `/branding/${filename}?t=${Date.now()}`
    return NextResponse.json({ url, type }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
