export const dynamic = 'force-dynamic'
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { applyTemplateToProject } from '@/lib/templates/engine'
import { notifyProjectCreated } from '@/lib/notifications/service'
import { createAuditLog } from '@/lib/utils/audit'
import { z } from 'zod'
import { UserRole, ProjectType } from '@prisma/client'
import slugify from '@/lib/utils/slugify'
import { handleApiError } from '@/lib/utils/api-error'

const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.nativeEnum(ProjectType),
  description: z.string().optional(),
  clientProfileId: z.string().optional(),
  projectManagerId: z.string().optional(),
  projectHeadId: z.string().optional(),
  bgmId: z.string().optional(),
  proposedBudget: z.number().optional(),
  agreedBudget: z.number().optional(),
  currency: z.string().default('INR'),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  useTemplate: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const health = searchParams.get('health')
    const search = searchParams.get('search')

    const userRole = session.user.role as UserRole

    // Build where clause based on role
    let whereClause: any = { isArchived: false }
    
    if (status) whereClause.status = status
    if (health) whereClause.health = health
    if (search) whereClause.name = { contains: search, mode: 'insensitive' }

    // Role-based filtering
    switch (userRole) {
    case 'PROJECT_MANAGER':
      whereClause.projectManagerId = session.user.id
      break
    case 'DEVELOPER':
      whereClause.developers = { some: { userId: session.user.id } }
      break
    case 'CLIENT_ADMIN':
    case 'CLIENT_MEMBER':
      whereClause.clientProfile = { userId: session.user.id }
      break
    // SUPER_ADMIN, PROJECT_HEAD, BGM see all
  }

    const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: whereClause,
      include: {
        projectManager: { select: { id: true, name: true, avatar: true } },
        projectHead: { select: { id: true, name: true, avatar: true } },
        clientProfile: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        developers: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: {
          select: { tasks: true, updates: true, changeRequests: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where: whereClause }),
    ])

    return NextResponse.json({
    data: projects,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userRole = session.user.role as UserRole
    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.PROJECT_HEAD, UserRole.BUSINESS_GROWTH_MANAGER]
    
    if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    const body = await req.json()
    const parsed = CreateProjectSchema.safeParse(body)

    if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

    const data = parsed.data
    const baseSlug = slugify(data.name)
    
    // Ensure unique slug
    let slug = baseSlug
    let attempt = 0
    while (await prisma.project.findUnique({ where: { slug } })) {
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

    const project = await prisma.project.create({
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      slug,
      clientProfileId: data.clientProfileId,
      projectManagerId: data.projectManagerId,
      projectHeadId: data.projectHeadId || session.user.id,
      bgmId: data.bgmId,
      proposedBudget: data.proposedBudget,
      agreedBudget: data.agreedBudget,
      currency: data.currency,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : undefined,
      status: 'DRAFT',
    },
  })

    // Apply template
    if (data.useTemplate && data.projectManagerId) {
    await applyTemplateToProject(
      project.id,
      data.type,
      data.projectManagerId,
      data.startDate ? new Date(data.startDate) : undefined
    )
  }

    // Notify
    await notifyProjectCreated(project.id)

    // Audit
    await createAuditLog({
    userId: session.user.id,
    projectId: project.id,
    action: 'CREATE',
    entity: 'Project',
    entityId: project.id,
    newValues: { name: project.name, type: project.type },
  })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
