// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleApiError } from '@/lib/utils/api-error'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const start = Date.now()
    const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {}

    // Database check
    try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (err) {
    checks.database = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Database unreachable',
    }
  }

  // Supabase check
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
    const supaStart = Date.now()
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
      signal: AbortSignal.timeout(3000),
    })
    checks.supabase = {
      status: res.ok || res.status === 400 ? 'ok' : 'error', // 400 = no table specified = Supabase alive
      latencyMs: Date.now() - supaStart,
    }
  } catch (err) {
    checks.supabase = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Supabase unreachable',
    }
  }

  // Environment check
  const requiredEnvVars = ['NEXTAUTH_SECRET', 'DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']
  const missingEnv = requiredEnvVars.filter(k => !process.env[k])
  checks.environment = missingEnv.length === 0
    ? { status: 'ok' }
    : { status: 'error', error: `Missing: ${missingEnv.join(', ')}` }

  const allOk = Object.values(checks).every(c => c.status === 'ok')
  const totalMs = Date.now() - start

  const body = {
    status: allOk ? 'ok' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
    totalLatencyMs: totalMs,
    checks,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(body, {
    status: allOk ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache',
      'Content-Type': 'application/json',
    },
  })
  } catch (error) {
    return handleApiError(error)
  }
}
