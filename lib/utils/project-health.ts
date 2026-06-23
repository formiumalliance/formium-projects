// lib/utils/project-health.ts
// Automatically classifies project health and pauses timelines

import { prisma } from '@/lib/db/prisma'
import { ProjectHealth } from '@prisma/client'

interface HealthAssessment {
  health: ProjectHealth
  reason: string
  shouldPauseTimeline: boolean
  pauseReason?: string
}

export async function assessProjectHealth(projectId: string): Promise<HealthAssessment> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        where: { status: { not: 'DONE' } },
        orderBy: { dueDate: 'asc' },
      },
      requirements: {
        where: { isRequired: true },
      },
      changeRequests: {
        where: { status: 'PENDING' },
      },
    },
  })

  if (!project) throw new Error('Project not found')

  const now = new Date()
  
  // Check for missing required requirements beyond grace period
  const pendingRequiredRequirements = project.requirements.filter(r => !r.isReceived)
  
  if (pendingRequiredRequirements.length > 0) {
    const oldestPending = pendingRequiredRequirements[0]
    if (oldestPending.dueDate) {
      const daysPastDue = Math.floor((now.getTime() - oldestPending.dueDate.getTime()) / 86400000)
      
      if (daysPastDue > project.gracePeriodDays) {
        return {
          health: 'WAITING_FOR_CLIENT',
          reason: `${pendingRequiredRequirements.length} required input(s) not received`,
          shouldPauseTimeline: true,
          pauseReason: `Required inputs missing for ${daysPastDue} days`,
        }
      }
    }
  }

  // Check for overdue tasks
  const overdueTasks = project.tasks.filter(task => 
    task.dueDate && 
    task.dueDate < now && 
    !['DONE', 'APPROVED'].includes(task.status)
  )

  if (overdueTasks.length > 0) {
    const daysMostOverdue = Math.max(
      ...overdueTasks.map(t => 
        Math.floor((now.getTime() - t.dueDate!.getTime()) / 86400000)
      )
    )

    if (daysMostOverdue > 7) {
      return {
        health: 'DELAYED',
        reason: `${overdueTasks.length} task(s) overdue by more than 7 days`,
        shouldPauseTimeline: false,
      }
    }

    return {
      health: 'AT_RISK',
      reason: `${overdueTasks.length} task(s) are overdue`,
      shouldPauseTimeline: false,
    }
  }

  // Check expected end date
  if (project.expectedEndDate) {
    const daysToDeadline = Math.floor(
      (project.expectedEndDate.getTime() - now.getTime()) / 86400000
    )
    
    if (daysToDeadline < 0) {
      return {
        health: 'DELAYED',
        reason: 'Project is past its expected end date',
        shouldPauseTimeline: false,
      }
    }
    
    if (daysToDeadline < 7 && project.progress < 90) {
      return {
        health: 'AT_RISK',
        reason: 'Deadline approaching with significant work remaining',
        shouldPauseTimeline: false,
      }
    }
  }

  return {
    health: 'ON_TRACK',
    reason: 'Project is progressing normally',
    shouldPauseTimeline: false,
  }
}

export async function updateProjectHealth(projectId: string): Promise<void> {
  const assessment = await assessProjectHealth(projectId)
  
  const updateData: Record<string, unknown> = {
    health: assessment.health,
  }

  if (assessment.shouldPauseTimeline) {
    updateData.timelinePaused = true
    updateData.timelinePausedAt = new Date()
    updateData.timelinePauseReason = assessment.pauseReason
  }

  await prisma.project.update({
    where: { id: projectId },
    data: updateData,
  })
}

// Calculate project progress from tasks
export async function recalculateProgress(projectId: string): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { status: true },
  })

  if (tasks.length === 0) return 0

  const completed = tasks.filter(t => ['DONE', 'APPROVED'].includes(t.status)).length
  const progress = Math.round((completed / tasks.length) * 100)

  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  })

  return progress
}

// Schedule this to run daily via a cron job
export async function runHealthCheckAll(): Promise<void> {
  const activeProjects = await prisma.project.findMany({
    where: {
      status: 'ACTIVE',
      isArchived: false,
    },
    select: { id: true },
  })

  for (const project of activeProjects) {
    try {
      await updateProjectHealth(project.id)
      await recalculateProgress(project.id)
    } catch (err) {
      console.error(`Health check failed for project ${project.id}:`, err)
    }
  }
}

// Archive projects older than 90 days after completion
export async function runArchiveCheck(): Promise<void> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000)
  
  const projectsToArchive = await prisma.project.findMany({
    where: {
      status: 'COMPLETED',
      isArchived: false,
      actualEndDate: { lte: ninetyDaysAgo },
    },
    select: { id: true, name: true },
  })

  for (const project of projectsToArchive) {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        status: 'ARCHIVED',
      },
    })
    
    console.log(`Archived project: ${project.name} (${project.id})`)
  }
}
