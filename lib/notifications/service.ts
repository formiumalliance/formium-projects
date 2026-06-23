// lib/notifications/service.ts
import { prisma } from '@/lib/db/prisma'
import { NotificationType } from '@prisma/client'

interface CreateNotificationInput {
  userId: string
  projectId?: string
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      type: input.type,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl,
    },
  })
}

export async function createNotificationsForRole(
  role: string,
  input: Omit<CreateNotificationInput, 'userId'>
) {
  const users = await prisma.user.findMany({
    where: { role: role as import('@prisma/client').UserRole, isActive: true },
    select: { id: true },
  })

  return prisma.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      ...input,
    })),
  })
}

export async function notifyProjectCreated(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectManager: { select: { id: true } },
      projectHead: { select: { id: true } },
      clientProfile: { select: { userId: true } },
    },
  })
  if (!project) return

  const recipients = [
    project.projectManager?.id,
    project.projectHead?.id,
    project.clientProfile?.userId,
  ].filter(Boolean) as string[]

  for (const userId of recipients) {
    await createNotification({
      userId,
      projectId,
      type: 'PROJECT_CREATED',
      title: 'Project created',
      body: `"${project.name}" has been set up and is ready.`,
      actionUrl: `/pm/projects/${project.slug}`,
    })
  }
}

export async function notifyTaskAssigned(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      assignee: { select: { id: true } },
    },
  })
  if (!task?.assignee) return

  await createNotification({
    userId: task.assignee.id,
    projectId: task.project.id,
    type: 'TASK_ASSIGNED',
    title: 'New task assigned',
    body: `"${task.title}" has been assigned to you on ${task.project.name}.`,
    actionUrl: `/dev/tasks/${taskId}`,
  })
}

export async function notifyUpdatePublished(updateId: string) {
  const update = await prisma.projectUpdate.findUnique({
    where: { id: updateId },
    include: {
      project: {
        include: {
          clientProfile: { select: { userId: true } },
        },
      },
    },
  })
  if (!update?.project.clientProfile) return

  await createNotification({
    userId: update.project.clientProfile.userId,
    projectId: update.project.id,
    type: 'UPDATE_PUBLISHED',
    title: 'New project update',
    body: `"${update.title}" has been posted on ${update.project.name}.`,
    actionUrl: `/client/projects/${update.project.slug}/updates`,
  })
}

export async function notifyChangeRequestDecision(changeRequestId: string) {
  const cr = await prisma.changeRequest.findUnique({
    where: { id: changeRequestId },
    include: {
      project: {
        include: {
          clientProfile: { select: { userId: true } },
          projectManager: { select: { id: true } },
        },
      },
    },
  })
  if (!cr) return

  const recipients = [
    cr.project.clientProfile?.userId,
    cr.project.projectManager?.id,
  ].filter(Boolean) as string[]

  for (const userId of recipients) {
    await createNotification({
      userId,
      projectId: cr.project.id,
      type: 'CHANGE_REQUEST_DECISION',
      title: `Change request ${cr.status.toLowerCase()}`,
      body: `"${cr.title}" has been ${cr.status.toLowerCase()}.`,
      actionUrl: `/client/projects/${cr.project.slug}/change-requests`,
    })
  }
}

export async function notifyHandoverReady(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      clientProfile: { select: { userId: true } },
    },
  })
  if (!project?.clientProfile) return

  await createNotification({
    userId: project.clientProfile.userId,
    projectId,
    type: 'HANDOVER_READY',
    title: 'Handover package ready',
    body: `Your ${project.name} handover package is ready for download.`,
    actionUrl: `/client/projects/${project.slug}/handover`,
  })
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
}
