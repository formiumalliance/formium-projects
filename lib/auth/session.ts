// lib/auth/session.ts
import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'
import { UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'
import { ROLE_DASHBOARDS } from './auth-options'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    redirect('/login')
  }
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()
  const userRole = session.user.role as UserRole
  
  if (!allowedRoles.includes(userRole)) {
    redirect(ROLE_DASHBOARDS[userRole] || '/login')
  }
  
  return session
}

export async function requireInternalRole() {
  return requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.PROJECT_HEAD,
    UserRole.PROJECT_MANAGER,
    UserRole.BUSINESS_GROWTH_MANAGER,
    UserRole.DEVELOPER,
  ])
}

export async function requireClientRole() {
  return requireRole([UserRole.CLIENT_ADMIN, UserRole.CLIENT_MEMBER])
}

export async function requireAdminRole() {
  return requireRole([UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD])
}

// Middleware helper to check project access
export async function canAccessProject(projectId: string, userId: string, userRole: UserRole) {
  const { prisma } = await import('@/lib/db/prisma')
  
  // Admins can access all
  if ([UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD, UserRole.BUSINESS_GROWTH_MANAGER].includes(userRole)) {
    return true
  }
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      projectManagerId: true,
      projectHeadId: true,
      bgmId: true,
      developers: { select: { userId: true } },
      clientProfile: { select: { userId: true } },
    },
  })
  
  if (!project) return false
  
  if (userRole === UserRole.PROJECT_MANAGER) {
    return project.projectManagerId === userId
  }
  
  if (userRole === UserRole.DEVELOPER) {
    return project.developers.some(d => d.userId === userId)
  }
  
  if ([UserRole.CLIENT_ADMIN, UserRole.CLIENT_MEMBER].includes(userRole)) {
    return project.clientProfile?.userId === userId
  }
  
  return false
}
