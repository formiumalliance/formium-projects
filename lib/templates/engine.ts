// lib/templates/engine.ts
// Template Engine: Generates project structure from project type

import { prisma } from '@/lib/db/prisma'
import { ProjectType } from '@prisma/client'

interface GeneratedTask {
  title: string
  description?: string
  phase: string
  priority: string
  estimatedHours: number
  sortOrder: number
}

interface GeneratedFolder {
  name: string
  isCore: boolean
  parentName?: string
  isClientVisible: boolean
  sortOrder: number
}

interface GeneratedRequirement {
  title: string
  description?: string
  isRequired: boolean
  sortOrder: number
  daysFromStart?: number
}

interface GeneratedMilestone {
  title: string
  daysFromStart: number
  sortOrder: number
}

interface ProjectTemplate {
  tasks: GeneratedTask[]
  folders: GeneratedFolder[]
  requirements: GeneratedRequirement[]
  milestones: GeneratedMilestone[]
  gracePeriodDays: number
}

// ─── FOLDER STRUCTURES ────────────────────────────────────────────────────────

const CORE_FOLDERS: GeneratedFolder[] = [
  { name: 'Requirements', isCore: true, isClientVisible: true, sortOrder: 0 },
  { name: 'Designs & Wireframes', isCore: true, isClientVisible: true, sortOrder: 1 },
  { name: 'Assets & Brand', isCore: true, isClientVisible: true, sortOrder: 2 },
  { name: 'Content & Copy', isCore: true, isClientVisible: true, sortOrder: 3 },
  { name: 'Deliverables', isCore: true, isClientVisible: true, sortOrder: 4 },
  { name: 'Agreements & Invoices', isCore: true, isClientVisible: false, sortOrder: 5 },
  { name: 'Internal', isCore: true, isClientVisible: false, sortOrder: 6 },
  { name: 'Source Code', isCore: true, isClientVisible: false, sortOrder: 7 },
]

const ECOMMERCE_EXTRA_FOLDERS: GeneratedFolder[] = [
  { name: 'Product Catalogue', isCore: true, isClientVisible: true, sortOrder: 8 },
  { name: 'Payment & Shipping Docs', isCore: true, isClientVisible: true, sortOrder: 9 },
]

const APP_EXTRA_FOLDERS: GeneratedFolder[] = [
  { name: 'App Store Assets', isCore: true, isClientVisible: true, sortOrder: 8 },
  { name: 'API Documentation', isCore: false, isClientVisible: false, sortOrder: 9 },
]

// ─── TASK TEMPLATES ───────────────────────────────────────────────────────────

const WEBSITE_TASKS: GeneratedTask[] = [
  // Requirements Collection
  { title: 'Kickoff meeting & project brief review', phase: 'REQUIREMENTS_COLLECTION', priority: 'HIGH', estimatedHours: 2, sortOrder: 0 },
  { title: 'Collect brand assets (logo, fonts, colors)', phase: 'REQUIREMENTS_COLLECTION', priority: 'HIGH', estimatedHours: 1, sortOrder: 1 },
  { title: 'Content collection — Home, About, Services', phase: 'REQUIREMENTS_COLLECTION', priority: 'HIGH', estimatedHours: 2, sortOrder: 2 },
  { title: 'Collect reference sites and design preferences', phase: 'REQUIREMENTS_COLLECTION', priority: 'MEDIUM', estimatedHours: 1, sortOrder: 3 },
  { title: 'Domain & hosting information gathering', phase: 'REQUIREMENTS_COLLECTION', priority: 'MEDIUM', estimatedHours: 0.5, sortOrder: 4 },

  // Planning
  { title: 'Sitemap & information architecture', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 3, sortOrder: 0 },
  { title: 'Wireframes — Desktop & Mobile', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 8, sortOrder: 1 },
  { title: 'Design system setup (typography, colors, components)', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 4, sortOrder: 2 },
  { title: 'Client approval on wireframes', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 1, sortOrder: 3 },
  { title: 'High-fidelity UI design — Home page', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 8, sortOrder: 4 },
  { title: 'High-fidelity UI design — Inner pages', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 12, sortOrder: 5 },
  { title: 'Design approval from client', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 1, sortOrder: 6 },

  // Building
  { title: 'Development environment setup', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 2, sortOrder: 0 },
  { title: 'Home page development', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 12, sortOrder: 1 },
  { title: 'About page development', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 6, sortOrder: 2 },
  { title: 'Services/Products page development', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 8, sortOrder: 3 },
  { title: 'Contact page with form integration', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 4, sortOrder: 4 },
  { title: 'Mobile responsiveness implementation', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 8, sortOrder: 5 },
  { title: 'SEO meta tags and Open Graph setup', phase: 'BUILDING', priority: 'MEDIUM', estimatedHours: 3, sortOrder: 6 },
  { title: 'Performance optimisation', phase: 'BUILDING', priority: 'MEDIUM', estimatedHours: 4, sortOrder: 7 },
  { title: 'Cross-browser testing', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 4, sortOrder: 8 },
  { title: 'Analytics setup (GA4)', phase: 'BUILDING', priority: 'MEDIUM', estimatedHours: 2, sortOrder: 9 },

  // Review & Feedback
  { title: 'Internal QA review', phase: 'REVIEW_FEEDBACK', priority: 'HIGH', estimatedHours: 4, sortOrder: 0 },
  { title: 'Client UAT (User Acceptance Testing)', phase: 'REVIEW_FEEDBACK', priority: 'HIGH', estimatedHours: 2, sortOrder: 1 },
  { title: 'Feedback implementation round 1', phase: 'REVIEW_FEEDBACK', priority: 'HIGH', estimatedHours: 6, sortOrder: 2 },
  { title: 'Final client approval', phase: 'REVIEW_FEEDBACK', priority: 'HIGH', estimatedHours: 1, sortOrder: 3 },

  // Launch
  { title: 'Domain configuration and DNS setup', phase: 'LAUNCH', priority: 'HIGH', estimatedHours: 2, sortOrder: 0 },
  { title: 'Production deployment', phase: 'LAUNCH', priority: 'HIGH', estimatedHours: 3, sortOrder: 1 },
  { title: 'Post-launch smoke testing', phase: 'LAUNCH', priority: 'HIGH', estimatedHours: 2, sortOrder: 2 },
  { title: 'Handover package preparation', phase: 'LAUNCH', priority: 'HIGH', estimatedHours: 2, sortOrder: 3 },
  { title: 'Client handover & training', phase: 'LAUNCH', priority: 'HIGH', estimatedHours: 2, sortOrder: 4 },
]

const ECOMMERCE_EXTRA_TASKS: GeneratedTask[] = [
  { title: 'Product catalogue structure planning', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 4, sortOrder: 10 },
  { title: 'Payment gateway integration (Razorpay/Stripe)', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 8, sortOrder: 10 },
  { title: 'Shopping cart and checkout flow', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 10, sortOrder: 11 },
  { title: 'Product pages — all variants', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 12, sortOrder: 12 },
  { title: 'Order management and email notifications', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 6, sortOrder: 13 },
  { title: 'Inventory management setup', phase: 'BUILDING', priority: 'MEDIUM', estimatedHours: 4, sortOrder: 14 },
  { title: 'Payment gateway test transactions', phase: 'REVIEW_FEEDBACK', priority: 'HIGH', estimatedHours: 3, sortOrder: 10 },
]

const MOBILE_APP_TASKS: GeneratedTask[] = [
  { title: 'App requirements and platform decision (iOS/Android/Both)', phase: 'REQUIREMENTS_COLLECTION', priority: 'HIGH', estimatedHours: 3, sortOrder: 0 },
  { title: 'User flow diagrams and screen mapping', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 6, sortOrder: 0 },
  { title: 'App wireframes — all screens', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 16, sortOrder: 1 },
  { title: 'UI design — all screens', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 24, sortOrder: 2 },
  { title: 'Development environment and CI/CD setup', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 4, sortOrder: 0 },
  { title: 'Authentication module', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 8, sortOrder: 1 },
  { title: 'Core feature modules', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 40, sortOrder: 2 },
  { title: 'Push notifications', phase: 'BUILDING', priority: 'MEDIUM', estimatedHours: 6, sortOrder: 3 },
  { title: 'API integration', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 16, sortOrder: 4 },
  { title: 'App Store / Play Store submission', phase: 'LAUNCH', priority: 'HIGH', estimatedHours: 4, sortOrder: 0 },
]

const SAAS_EXTRA_TASKS: GeneratedTask[] = [
  { title: 'Database architecture and schema design', phase: 'PLANNING', priority: 'HIGH', estimatedHours: 8, sortOrder: 7 },
  { title: 'Multi-tenancy setup', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 16, sortOrder: 0 },
  { title: 'Authentication and authorization system', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 12, sortOrder: 1 },
  { title: 'Subscription and billing integration', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 16, sortOrder: 10 },
  { title: 'Admin panel development', phase: 'BUILDING', priority: 'HIGH', estimatedHours: 20, sortOrder: 11 },
  { title: 'API documentation', phase: 'REVIEW_FEEDBACK', priority: 'MEDIUM', estimatedHours: 8, sortOrder: 5 },
]

// ─── REQUIREMENTS ─────────────────────────────────────────────────────────────

const WEBSITE_REQUIREMENTS: GeneratedRequirement[] = [
  { title: 'Brand logo (SVG or high-res PNG)', isRequired: true, sortOrder: 0 },
  { title: 'Brand color codes (HEX/Pantone)', isRequired: true, sortOrder: 1 },
  { title: 'Brand fonts (or font preferences)', isRequired: true, sortOrder: 2 },
  { title: 'Domain login credentials', isRequired: true, sortOrder: 3 },
  { title: 'Hosting details (if existing)', isRequired: false, sortOrder: 4 },
  { title: 'Home page content — headline, tagline, about text', isRequired: true, sortOrder: 5 },
  { title: 'Services/products list with descriptions', isRequired: true, sortOrder: 6 },
  { title: 'Team photos and bios (if needed)', isRequired: false, sortOrder: 7 },
  { title: 'Contact details and Google Maps location', isRequired: true, sortOrder: 8 },
  { title: '3 reference websites you like', isRequired: false, sortOrder: 9 },
  { title: 'Social media profile links', isRequired: false, sortOrder: 10 },
]

const ECOMMERCE_EXTRA_REQUIREMENTS: GeneratedRequirement[] = [
  { title: 'Product list with names, descriptions, prices', isRequired: true, sortOrder: 11 },
  { title: 'Product images (high-resolution)', isRequired: true, sortOrder: 12 },
  { title: 'Shipping rates and zones', isRequired: true, sortOrder: 13 },
  { title: 'Return and refund policy', isRequired: true, sortOrder: 14 },
  { title: 'Payment gateway preference', isRequired: true, sortOrder: 15 },
  { title: 'GST/tax details', isRequired: true, sortOrder: 16 },
]

// ─── MILESTONES ───────────────────────────────────────────────────────────────

const WEBSITE_MILESTONES: GeneratedMilestone[] = [
  { title: 'Requirements signed off', daysFromStart: 5, sortOrder: 0 },
  { title: 'Wireframes approved', daysFromStart: 12, sortOrder: 1 },
  { title: 'Design approved', daysFromStart: 20, sortOrder: 2 },
  { title: 'Development complete', daysFromStart: 45, sortOrder: 3 },
  { title: 'Client UAT complete', daysFromStart: 52, sortOrder: 4 },
  { title: 'Live launch', daysFromStart: 60, sortOrder: 5 },
]

const MOBILE_MILESTONES: GeneratedMilestone[] = [
  { title: 'Requirements and scope signed off', daysFromStart: 7, sortOrder: 0 },
  { title: 'UI/UX designs approved', daysFromStart: 25, sortOrder: 1 },
  { title: 'Alpha build ready', daysFromStart: 60, sortOrder: 2 },
  { title: 'Beta testing complete', daysFromStart: 80, sortOrder: 3 },
  { title: 'App store submission', daysFromStart: 90, sortOrder: 4 },
  { title: 'App live on stores', daysFromStart: 100, sortOrder: 5 },
]

// ─── TEMPLATE RESOLVER ────────────────────────────────────────────────────────

export function resolveTemplate(projectType: ProjectType): ProjectTemplate {
  let tasks: GeneratedTask[] = []
  let folders: GeneratedFolder[] = [...CORE_FOLDERS]
  let requirements: GeneratedRequirement[] = []
  let milestones: GeneratedMilestone[] = []

  switch (projectType) {
    case 'ECOMMERCE_WEBSITE':
      tasks = [...WEBSITE_TASKS, ...ECOMMERCE_EXTRA_TASKS]
      folders = [...CORE_FOLDERS, ...ECOMMERCE_EXTRA_FOLDERS]
      requirements = [...WEBSITE_REQUIREMENTS, ...ECOMMERCE_EXTRA_REQUIREMENTS]
      milestones = WEBSITE_MILESTONES
      break

    case 'MOBILE_APP':
      tasks = MOBILE_APP_TASKS
      folders = [...CORE_FOLDERS, ...APP_EXTRA_FOLDERS]
      requirements = [
        { title: 'App concept document or brief', isRequired: true, sortOrder: 0 },
        { title: 'Brand assets (logo, colors, fonts)', isRequired: true, sortOrder: 1 },
        { title: 'Target platform (iOS / Android / Both)', isRequired: true, sortOrder: 2 },
        { title: 'Apple Developer / Google Play account access', isRequired: false, sortOrder: 3 },
        { title: 'Backend API details (if existing)', isRequired: false, sortOrder: 4 },
        { title: 'Reference apps you like', isRequired: false, sortOrder: 5 },
      ]
      milestones = MOBILE_MILESTONES
      break

    case 'SAAS':
    case 'CRM':
    case 'ERP':
      tasks = [...WEBSITE_TASKS, ...SAAS_EXTRA_TASKS]
      folders = [...CORE_FOLDERS, ...APP_EXTRA_FOLDERS]
      requirements = [
        ...WEBSITE_REQUIREMENTS,
        { title: 'Detailed feature specification document', isRequired: true, sortOrder: 11 },
        { title: 'User roles and permissions matrix', isRequired: true, sortOrder: 12 },
        { title: 'Third-party integrations required', isRequired: false, sortOrder: 13 },
        { title: 'Data migration requirements', isRequired: false, sortOrder: 14 },
      ]
      milestones = [
        ...WEBSITE_MILESTONES,
        { title: 'Backend API complete', daysFromStart: 55, sortOrder: 4 },
        { title: 'Integration testing complete', daysFromStart: 70, sortOrder: 5 },
      ]
      break

    default:
      // Business Website, Portfolio, Catalogue, Custom
      tasks = WEBSITE_TASKS
      requirements = WEBSITE_REQUIREMENTS
      milestones = WEBSITE_MILESTONES
  }

  return {
    tasks,
    folders,
    requirements,
    milestones,
    gracePeriodDays: 3,
  }
}

// ─── APPLY TEMPLATE TO PROJECT ────────────────────────────────────────────────

export async function applyTemplateToProject(
  projectId: string,
  projectType: ProjectType,
  pmId: string,
  startDate?: Date
): Promise<void> {
  const template = resolveTemplate(projectType)
  const base = startDate || new Date()

  await prisma.$transaction(async (tx) => {
    // Create folders
    const folderMap = new Map<string, string>()
    
    for (const folder of template.folders) {
      const parentId = folder.parentName ? folderMap.get(folder.parentName) : undefined
      const created = await tx.projectFolder.create({
        data: {
          projectId,
          name: folder.name,
          isCore: folder.isCore,
          isClientVisible: folder.isClientVisible,
          parentId,
          sortOrder: folder.sortOrder,
        },
      })
      folderMap.set(folder.name, created.id)
    }

    // Create tasks
    await tx.task.createMany({
      data: template.tasks.map(task => ({
        projectId,
        title: task.title,
        description: task.description,
        phase: task.phase as any,
        priority: task.priority as any,
        estimatedHours: task.estimatedHours,
        sortOrder: task.sortOrder,
        creatorId: pmId,
        status: 'TODO',
        isClientVisible: false,
      })),
    })

    // Create requirements
    await tx.requirement.createMany({
      data: template.requirements.map(req => ({
        projectId,
        title: req.title,
        description: req.description,
        isRequired: req.isRequired,
        sortOrder: req.sortOrder,
        dueDate: req.daysFromStart ? new Date(base.getTime() + req.daysFromStart * 86400000) : undefined,
      })),
    })

    // Create milestones
    await tx.milestone.createMany({
      data: template.milestones.map(ms => ({
        projectId,
        title: ms.title,
        daysFromStart: ms.daysFromStart,
        sortOrder: ms.sortOrder,
        dueDate: new Date(base.getTime() + ms.daysFromStart * 86400000),
      })),
    })
  })
}
