// lib/auth/auth-options.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            passwordHash: true,
            isActive: true,
          },
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated. Please contact support.')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role as any
      }
      return token
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  
  events: {
    async signIn({ user }) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SIGN_IN',
          entity: 'User',
          entityId: user.id,
        },
      })
    },
  },
}

// ─── ROLE PERMISSION MATRIX ──────────────────────────────────────────────────

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canManageUsers: true,
    canManageAllProjects: true,
    canViewAllProjects: true,
    canCreateProjects: true,
    canAssignPM: true,
    canAssignDevelopers: true,
    canApproveChangeRequests: true,
    canManageTemplates: true,
    canViewFinancials: true,
    canManageHandovers: true,
    canArchiveProjects: true,
    canViewAuditLogs: true,
  },
  PROJECT_HEAD: {
    canManageUsers: false,
    canManageAllProjects: true,
    canViewAllProjects: true,
    canCreateProjects: true,
    canAssignPM: true,
    canAssignDevelopers: true,
    canApproveChangeRequests: true,
    canManageTemplates: true,
    canViewFinancials: true,
    canManageHandovers: true,
    canArchiveProjects: true,
    canViewAuditLogs: true,
  },
  PROJECT_MANAGER: {
    canManageUsers: false,
    canManageAllProjects: false,
    canViewAllProjects: false,
    canCreateProjects: false,
    canAssignPM: false,
    canAssignDevelopers: true,
    canApproveChangeRequests: false,
    canManageTemplates: false,
    canViewFinancials: false,
    canManageHandovers: true,
    canArchiveProjects: false,
    canViewAuditLogs: false,
  },
  BUSINESS_GROWTH_MANAGER: {
    canManageUsers: false,
    canManageAllProjects: false,
    canViewAllProjects: true,
    canCreateProjects: true,
    canAssignPM: false,
    canAssignDevelopers: false,
    canApproveChangeRequests: false,
    canManageTemplates: false,
    canViewFinancials: true,
    canManageHandovers: false,
    canArchiveProjects: false,
    canViewAuditLogs: false,
  },
  DEVELOPER: {
    canManageUsers: false,
    canManageAllProjects: false,
    canViewAllProjects: false,
    canCreateProjects: false,
    canAssignPM: false,
    canAssignDevelopers: false,
    canApproveChangeRequests: false,
    canManageTemplates: false,
    canViewFinancials: false,
    canManageHandovers: false,
    canArchiveProjects: false,
    canViewAuditLogs: false,
  },
  CLIENT_ADMIN: {
    canManageUsers: false,
    canManageAllProjects: false,
    canViewAllProjects: false,
    canCreateProjects: false,
    canAssignPM: false,
    canAssignDevelopers: false,
    canApproveChangeRequests: false,
    canManageTemplates: false,
    canViewFinancials: false,
    canManageHandovers: false,
    canArchiveProjects: false,
    canViewAuditLogs: false,
  },
  CLIENT_MEMBER: {
    canManageUsers: false,
    canManageAllProjects: false,
    canViewAllProjects: false,
    canCreateProjects: false,
    canAssignPM: false,
    canAssignDevelopers: false,
    canApproveChangeRequests: false,
    canManageTemplates: false,
    canViewFinancials: false,
    canManageHandovers: false,
    canArchiveProjects: false,
    canViewAuditLogs: false,
  },
} as const

export function hasPermission(
  role: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS['SUPER_ADMIN']
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

// Portal routes by role
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  SUPER_ADMIN: '/super-admin',
  PROJECT_HEAD: '/project-head',
  PROJECT_MANAGER: '/pm',
  BUSINESS_GROWTH_MANAGER: '/bgm',
  DEVELOPER: '/dev',
  CLIENT_ADMIN: '/client',
  CLIENT_MEMBER: '/client',
}
