export const dynamic = 'force-dynamic'
// app/api/admin/config/route.ts
// FIX BUG-003: Returns server-side env info to the client settings page
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { UserRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== UserRole.SUPER_ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    smtpConfigured: !!process.env.SMTP_HOST,
    smtpHost: process.env.SMTP_HOST || null,
  })
}
