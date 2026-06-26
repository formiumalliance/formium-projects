// prisma/seed.ts
import { PrismaClient, UserRole, TaskStatus, TaskPriority } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Formium Projects database…')

  // ─── SUPER ADMIN ───────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Formium@Admin2024!', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@formiumalliance.com' },
    update: {},
    create: {
      email: 'admin@formiumalliance.com',
      name: 'Super Admin',
      passwordHash: adminHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  })
  console.log('✅ Super Admin created:', superAdmin.email)

  // ─── PROJECT HEAD ──────────────────────────────────────────────────────────
  const headHash = await bcrypt.hash('Formium@Head2024!', 12)
  await prisma.user.upsert({
    where: { email: 'head@formiumalliance.com' },
    update: {},
    create: {
      email: 'head@formiumalliance.com',
      name: 'Project Head',
      passwordHash: headHash,
      role: UserRole.PROJECT_HEAD,
      isActive: true,
    },
  })
  console.log('✅ Project Head created')

  // ─── PROJECT MANAGER ───────────────────────────────────────────────────────
  const pmHash = await bcrypt.hash('Formium@PM2024!', 12)
  const pm = await prisma.user.upsert({
    where: { email: 'pm@formiumalliance.com' },
    update: {},
    create: {
      email: 'pm@formiumalliance.com',
      name: 'Priya Menon',
      passwordHash: pmHash,
      role: UserRole.PROJECT_MANAGER,
      isActive: true,
    },
  })
  console.log('✅ Project Manager created')

  // ─── DEVELOPER ─────────────────────────────────────────────────────────────
  const devHash = await bcrypt.hash('Formium@Dev2024!', 12)
  const dev = await prisma.user.upsert({
    where: { email: 'dev@formiumalliance.com' },
    update: {},
    create: {
      email: 'dev@formiumalliance.com',
      name: 'Rahul Kumar',
      passwordHash: devHash,
      role: UserRole.DEVELOPER,
      isActive: true,
    },
  })
  console.log('✅ Developer created')

  // ─── BGM ───────────────────────────────────────────────────────────────────
  const bgmHash = await bcrypt.hash('Formium@BGM2024!', 12)
  await prisma.user.upsert({
    where: { email: 'bgm@formiumalliance.com' },
    update: {},
    create: {
      email: 'bgm@formiumalliance.com',
      name: 'Ananya Shah',
      passwordHash: bgmHash,
      role: UserRole.BUSINESS_GROWTH_MANAGER,
      isActive: true,
    },
  })
  console.log('✅ BGM created')

  // ─── CLIENT ────────────────────────────────────────────────────────────────
  const clientHash = await bcrypt.hash('Formium@Client2024!', 12)
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      name: 'Arjun Sharma',
      passwordHash: clientHash,
      role: UserRole.CLIENT_ADMIN,
      isActive: true,
      phone: '+91 98765 43210',
    },
  })

  const clientProfile = await prisma.clientProfile.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      companyName: 'Sunrise Interiors Pvt Ltd',
      industry: 'Interior Design',
      website: 'https://sunriseinteriors.com',
    },
  })
  console.log('✅ Client created:', clientUser.email)

  // ─── DEMO PROJECT ──────────────────────────────────────────────────────────
  const existingProject = await prisma.project.findUnique({ where: { slug: 'sunrise-interiors-website' } })

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        name: 'Sunrise Interiors — Business Website',
        slug: 'sunrise-interiors-website',
        type: 'BUSINESS_WEBSITE',
        description: 'A premium business website for Sunrise Interiors showcasing portfolio, services and contact.',
        status: 'ACTIVE',
        health: 'ON_TRACK',
        phase: 'BUILDING',
        progress: 42,
        projectManagerId: pm.id,
        clientProfileId: clientProfile.id,
        agreedBudget: 75000,
        advanceAmount: 30000,
        advancePaidAt: new Date('2024-01-15'),
        currency: 'INR',
        startDate: new Date('2024-01-20'),
        expectedEndDate: new Date('2024-03-20'),
        gracePeriodDays: 3,
      },
    })

    // Add developer
    await prisma.projectDeveloper.create({
      data: { projectId: project.id, userId: dev.id, role: 'Lead Developer' },
    })

    // Create folders
    const folders = [
      { name: 'Requirements', isCore: true, isClientVisible: true, sortOrder: 0 },
      { name: 'Designs & Wireframes', isCore: true, isClientVisible: true, sortOrder: 1 },
      { name: 'Assets & Brand', isCore: true, isClientVisible: true, sortOrder: 2 },
      { name: 'Content & Copy', isCore: true, isClientVisible: true, sortOrder: 3 },
      { name: 'Deliverables', isCore: true, isClientVisible: true, sortOrder: 4 },
      { name: 'Internal', isCore: true, isClientVisible: false, sortOrder: 5 },
    ]

    for (const f of folders) {
      await prisma.projectFolder.create({ data: { projectId: project.id, ...f } })
    }

    // Create sample tasks
    const tasks = [
      { title: 'Kickoff meeting & project brief review', phase: 'REQUIREMENTS_COLLECTION', priority: 'HIGH', status: 'DONE', estimatedHours: 2 },
      { title: 'Collect brand assets (logo, fonts, colors)', phase: 'REQUIREMENTS_COLLECTION', priority: 'HIGH', status: 'DONE', estimatedHours: 1 },
      { title: 'Content collection — Home, About, Services', phase: 'REQUIREMENTS_COLLECTION', priority: 'HIGH', status: 'DONE', estimatedHours: 2 },
      { title: 'Sitemap & information architecture', phase: 'PLANNING', priority: 'HIGH', status: 'DONE', estimatedHours: 3 },
      { title: 'Wireframes — Desktop & Mobile', phase: 'PLANNING', priority: 'HIGH', status: 'DONE', estimatedHours: 8 },
      { title: 'High-fidelity UI design — Home page', phase: 'PLANNING', priority: 'HIGH', status: 'DONE', estimatedHours: 8 },
      { title: 'High-fidelity UI design — Inner pages', phase: 'PLANNING', priority: 'HIGH', status: 'DONE', estimatedHours: 12 },
      { title: 'Development environment setup', phase: 'BUILDING', priority: 'HIGH', status: 'DONE', estimatedHours: 2 },
      { title: 'Home page development', phase: 'BUILDING', priority: 'HIGH', status: 'IN_PROGRESS', estimatedHours: 12, assigneeId: dev.id },
      { title: 'About page development', phase: 'BUILDING', priority: 'HIGH', status: 'TODO', estimatedHours: 6, assigneeId: dev.id },
      { title: 'Services page development', phase: 'BUILDING', priority: 'HIGH', status: 'TODO', estimatedHours: 8, assigneeId: dev.id },
      { title: 'Contact page with form integration', phase: 'BUILDING', priority: 'HIGH', status: 'TODO', estimatedHours: 4, assigneeId: dev.id },
      { title: 'Mobile responsiveness', phase: 'BUILDING', priority: 'HIGH', status: 'TODO', estimatedHours: 8, assigneeId: dev.id },
      { title: 'Internal QA review', phase: 'REVIEW_FEEDBACK', priority: 'HIGH', status: 'TODO', estimatedHours: 4 },
      { title: 'Client UAT', phase: 'REVIEW_FEEDBACK', priority: 'HIGH', status: 'TODO', estimatedHours: 2 },
      { title: 'Production deployment', phase: 'LAUNCH', priority: 'HIGH', status: 'TODO', estimatedHours: 3 },
    ]

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      await prisma.task.create({
        data: {
          projectId: project.id,
          creatorId: pm.id,
          title: t.title,
          phase: t.phase as import('@prisma/client').ProjectPhase,
          priority: t.priority as TaskPriority,
          status: t.status as TaskStatus,
          estimatedHours: t.estimatedHours,
          assigneeId: t.assigneeId,
          sortOrder: i,
          completedAt: t.status === 'DONE' ? new Date() : undefined,
        },
      })
    }

    // Sample milestones
    const milestones = [
      { title: 'Requirements signed off', daysFromStart: 5, isCompleted: true, completedAt: new Date('2024-01-25') },
      { title: 'Wireframes approved', daysFromStart: 12, isCompleted: true, completedAt: new Date('2024-02-01') },
      { title: 'Design approved', daysFromStart: 20, isCompleted: true, completedAt: new Date('2024-02-10') },
      { title: 'Development complete', daysFromStart: 45, isCompleted: false },
      { title: 'Client UAT complete', daysFromStart: 52, isCompleted: false },
      { title: 'Live launch', daysFromStart: 60, isCompleted: false },
    ]

    for (let i = 0; i < milestones.length; i++) {
      const ms = milestones[i]
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          title: ms.title,
          isCompleted: ms.isCompleted,
          completedAt: ms.completedAt,
          dueDate: new Date(new Date('2024-01-20').getTime() + ms.daysFromStart * 86400000),
          sortOrder: i,
        },
      })
    }

    // Requirements
    const requirements = [
      { title: 'Brand logo (SVG or high-res PNG)', isReceived: true },
      { title: 'Brand color codes', isReceived: true },
      { title: 'Brand fonts', isReceived: true },
      { title: 'Home page content', isReceived: true },
      { title: 'Services list with descriptions', isReceived: true },
      { title: 'Team photos and bios', isReceived: false },
      { title: 'Domain login credentials', isReceived: false },
    ]

    for (let i = 0; i < requirements.length; i++) {
      const r = requirements[i]
      await prisma.requirement.create({
        data: {
          projectId: project.id,
          title: r.title,
          isRequired: true,
          isReceived: r.isReceived,
          receivedAt: r.isReceived ? new Date() : undefined,
          sortOrder: i,
        },
      })
    }

    // Sample published update
    await prisma.projectUpdate.create({
      data: {
        projectId: project.id,
        publishedById: pm.id,
        title: 'Designs approved — Development has started!',
        content: `Great news! Your website designs have been fully approved and our development team has started building.\n\nHere's what we've completed so far:\n• Full homepage design (desktop and mobile)\n• Services and About page layouts\n• Contact form design\n\nWhat's happening next:\nOur developer is now converting the approved designs into a fully functional website. You'll be able to see the live preview in approximately 2 weeks.\n\nIf you have any feedback or questions in the meantime, feel free to leave a comment below.`,
        phase: 'BUILDING',
        isPublished: true,
        publishedAt: new Date('2024-02-12'),
      },
    })

    // Invoice
    await prisma.invoice.create({
      data: {
        projectId: project.id,
        invoiceNumber: 'FA-INV-2024-001',
        amount: 30000,
        tax: 5400,
        totalAmount: 35400,
        isPaid: true,
        paidAt: new Date('2024-01-15'),
        notes: 'Advance payment — 40% of total project cost',
      },
    })

    console.log('✅ Demo project created:', project.name)
  }

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Demo login credentials:')
  console.log('   Super Admin:     admin@formiumalliance.com  / Formium@Admin2024!')
  console.log('   Project Head:    head@formiumalliance.com   / Formium@Head2024!')
  console.log('   Project Manager: pm@formiumalliance.com     / Formium@PM2024!')
  console.log('   Developer:       dev@formiumalliance.com    / Formium@Dev2024!')
  console.log('   BGM:             bgm@formiumalliance.com    / Formium@BGM2024!')
  console.log('   Client:          client@example.com         / Formium@Client2024!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
