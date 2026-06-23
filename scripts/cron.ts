// scripts/cron.ts
// Run this via cron on Hostinger:
// */15 * * * * node /path/to/app/.next/standalone/scripts/cron.js

import { runHealthCheckAll, runArchiveCheck } from '../lib/utils/project-health'
import { prisma } from '../lib/db/prisma'

async function main() {
  const now = new Date()
  console.log(`[CRON] ${now.toISOString()} — Running scheduled jobs`)

  try {
    // 1. Health check all active projects
    await runHealthCheckAll()
    console.log('[CRON] Health checks complete')

    // 2. Archive completed projects past 90 days
    await runArchiveCheck()
    console.log('[CRON] Archive check complete')

    // 3. Notify about deadlines approaching (7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000)
    const approachingDeadlines = await prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        isArchived: false,
        expectedEndDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        progress: { lt: 80 },
      },
      include: {
        projectManager: { select: { id: true } },
        projectHead: { select: { id: true } },
      },
    })

    for (const project of approachingDeadlines) {
      const recipients = [
        project.projectManager?.id,
        project.projectHead?.id,
      ].filter(Boolean) as string[]

      for (const userId of recipients) {
        // Check if we already notified today
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            projectId: project.id,
            type: 'DEADLINE_APPROACHING',
            createdAt: { gte: new Date(now.getTime() - 24 * 3600000) },
          },
        })
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId,
              projectId: project.id,
              type: 'DEADLINE_APPROACHING',
              title: 'Deadline approaching',
              body: `${project.name} is due in 7 days with ${project.progress}% progress.`,
              actionUrl: `/pm/projects/${project.id}`,
            },
          })
        }
      }
    }
    console.log(`[CRON] Deadline notifications sent for ${approachingDeadlines.length} projects`)

  } catch (err) {
    console.error('[CRON] Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
