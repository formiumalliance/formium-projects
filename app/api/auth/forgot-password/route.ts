export const dynamic = 'force-dynamic'
// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { passwordResetLimiter } from '@/lib/utils/rate-limit'
import { randomBytes } from 'crypto'
import { handleApiError } from '@/lib/utils/api-error'

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json()
    // Rate limit: 5 attempts per IP per hour
    const limited = passwordResetLimiter(req)
    if (limited) return limited

    const email = (body.email || '').toLowerCase().trim()

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Always 200 — never reveal if email exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ success: true })

    const token     = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600_000) // 1 hour

    // Delete old tokens for this user and create new one
    try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } })
    await db.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    })
  } catch {
    // PasswordResetToken model not yet migrated — log and continue
    console.warn('[ForgotPassword] PasswordResetToken model not available. Run db:push after schema update.')
    return NextResponse.json({ success: true })
  }

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  const htmlContent = `
    <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E8E8E8;overflow:hidden">
      <div style="padding:24px 32px;border-bottom:1px solid #F2F2F2">
        <span style="font-size:16px;font-weight:700;color:#0A0A0A">Formium</span>
        <span style="color:#FF3131;font-weight:700;font-size:16px"> Projects</span>
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0A0A0A">Password reset</h2>
        <p style="margin:0 0 24px;color:#4A4A4A;line-height:1.6">Hi ${user.name},<br>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#FF3131;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none">Reset password</a>
        <p style="margin:24px 0 0;font-size:12px;color:#8A8A8A">If you did not request this, you can ignore this email.</p>
      </div>
    </div>`

  const { sendEmail } = await import('@/lib/email/mailer')
  await sendEmail({
    to:      user.email,
    subject: 'Reset your Formium Projects password',
    html:    `<!DOCTYPE html><html><body style="background:#F8F8F8;padding:40px 20px">${htmlContent}</body></html>`,
  })

  return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
