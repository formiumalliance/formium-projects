// lib/email/mailer.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
})

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM!,
    to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Formium Projects</title>
</head>
<body style="margin:0;padding:0;background:#F8F8F8;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8F8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E8E8E8;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 40px;border-bottom:1px solid #F2F2F2;">
              <span style="font-size:18px;font-weight:600;color:#0A0A0A;letter-spacing:-0.3px;">Formium</span>
              <span style="color:#FF3131;font-weight:600;font-size:18px;"> Projects</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#F8F8F8;border-top:1px solid #F2F2F2;">
              <p style="margin:0;font-size:12px;color:#8A8A8A;line-height:1.5;">
                Formium Alliance LLP · Formium Projects Platform<br>
                You're receiving this because you have an account on Formium Projects.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(to: string, name: string, tempPassword?: string) {
  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#0A0A0A;letter-spacing:-0.5px;">Welcome to Formium Projects</h1>
<p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.6;">Hi ${name}, your account has been created. You can now log in to access your project dashboard.</p>
${tempPassword ? `<p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;">Your temporary password: <strong style="font-family:monospace;background:#F2F2F2;padding:2px 8px;border-radius:4px;">${tempPassword}</strong></p>` : ''}
<a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display:inline-block;background:#FF3131;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">Sign In</a>`
  
  await sendEmail({
    to,
    subject: 'Welcome to Formium Projects',
    html: emailWrapper(content),
  })
}

export async function sendProjectCreatedEmail(
  to: string,
  name: string,
  projectName: string,
  projectSlug: string
) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${projectSlug}`
  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#0A0A0A;">Your project is ready</h1>
<p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.6;">Hi ${name}, <strong>${projectName}</strong> has been set up and is ready for you to review. You can view your project dashboard below.</p>
<a href="${url}" style="display:inline-block;background:#FF3131;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">View Project</a>`
  
  await sendEmail({
    to,
    subject: `${projectName} is ready`,
    html: emailWrapper(content),
  })
}

export async function sendUpdatePublishedEmail(
  to: string,
  name: string,
  projectName: string,
  updateTitle: string,
  projectSlug: string
) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${projectSlug}/updates`
  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#0A0A0A;">New project update</h1>
<p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.6;">Hi ${name}, there's a new update on <strong>${projectName}</strong>: <em>${updateTitle}</em></p>
<a href="${url}" style="display:inline-block;background:#FF3131;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">View Update</a>`
  
  await sendEmail({
    to,
    subject: `Update on ${projectName}: ${updateTitle}`,
    html: emailWrapper(content),
  })
}

export async function sendChangeRequestDecisionEmail(
  to: string,
  name: string,
  projectName: string,
  crTitle: string,
  decision: 'APPROVED' | 'REJECTED',
  notes?: string
) {
  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#0A0A0A;">Change request ${decision.toLowerCase()}</h1>
<p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;line-height:1.6;">Hi ${name}, your change request "<strong>${crTitle}</strong>" on <strong>${projectName}</strong> has been ${decision.toLowerCase()}.</p>
${notes ? `<p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;background:#F8F8F8;padding:16px;border-radius:8px;border-left:3px solid #FF3131;">${notes}</p>` : ''}
<a href="${process.env.NEXT_PUBLIC_APP_URL}/client" style="display:inline-block;background:#FF3131;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">View Details</a>`
  
  await sendEmail({
    to,
    subject: `Change request ${decision.toLowerCase()}: ${crTitle}`,
    html: emailWrapper(content),
  })
}

export async function sendTaskAssignedEmail(
  to: string,
  name: string,
  taskTitle: string,
  projectName: string,
  dueDate?: Date
) {
  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#0A0A0A;">New task assigned</h1>
<p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;line-height:1.6;">Hi ${name}, a new task has been assigned to you on <strong>${projectName}</strong>:</p>
<p style="margin:0 0 ${dueDate ? '12' : '24'}px;font-size:15px;color:#0A0A0A;font-weight:500;">${taskTitle}</p>
${dueDate ? `<p style="margin:0 0 24px;font-size:14px;color:#8A8A8A;">Due: ${new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dev" style="display:inline-block;background:#FF3131;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">View Task</a>`
  
  await sendEmail({
    to,
    subject: `New task: ${taskTitle}`,
    html: emailWrapper(content),
  })
}

export async function sendHandoverReadyEmail(
  to: string,
  name: string,
  projectName: string,
  projectSlug: string
) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${projectSlug}/handover`
  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#0A0A0A;">Your project is ready for handover</h1>
<p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.6;">Hi ${name}, <strong>${projectName}</strong> has been completed and your handover package is ready for download. This includes all assets, source code, credentials, and deployment details.</p>
<a href="${url}" style="display:inline-block;background:#FF3131;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">Download Handover Package</a>`
  
  await sendEmail({
    to,
    subject: `${projectName} is ready for handover`,
    html: emailWrapper(content),
  })
}
