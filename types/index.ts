// types/index.ts
// Formium Projects - Shared TypeScript Types

import type {
  User,
  Project,
  Task,
  ProjectUpdate,
  ChangeRequest,
  Notification,
  ProjectFolder,
  FileAttachment,
  FeedbackItem,
  Milestone,
  Requirement,
  Handover,
  AuditLog,
  ProjectDocument,
  Invoice,
  Proposal,
} from '@prisma/client'

export type {
  User,
  Project,
  Task,
  ProjectUpdate,
  ChangeRequest,
  Notification,
  ProjectFolder,
  FileAttachment,
  FeedbackItem,
  Milestone,
  Requirement,
  Handover,
  AuditLog,
  ProjectDocument,
  Invoice,
  Proposal,
}

// ─── SESSION ─────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

// ─── API RESPONSES ────────────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── PROJECT ─────────────────────────────────────────────────────────────────

export interface ProjectWithRelations extends Project {
  projectManager?: Pick<User, 'id' | 'name' | 'avatar' | 'email'> | null
  projectHead?: Pick<User, 'id' | 'name' | 'avatar' | 'email'> | null
  bgm?: Pick<User, 'id' | 'name' | 'avatar' | 'email'> | null
  clientProfile?: {
    id: string
    companyName?: string | null
    user: Pick<User, 'id' | 'name' | 'email' | 'avatar'>
  } | null
  developers?: Array<{
    user: Pick<User, 'id' | 'name' | 'avatar' | 'role'>
    role?: string | null
    assignedAt: Date
  }>
  _count?: {
    tasks: number
    updates: number
    changeRequests: number
    documents: number
  }
}

export interface DashboardProject {
  id: string
  name: string
  type: string
  status: string
  health: string
  phase: string
  progress: number
  slug: string
  startDate?: Date | null
  expectedEndDate?: Date | null
  clientName?: string
  pmName?: string
  taskCount?: number
  pendingTasks?: number
}

// ─── TASK ─────────────────────────────────────────────────────────────────────

export interface TaskWithRelations extends Task {
  assignee?: Pick<User, 'id' | 'name' | 'avatar'> | null
  creator: Pick<User, 'id' | 'name' | 'avatar'>
  subtasks?: Task[]
  _count?: {
    subtasks: number
    comments: number
  }
}

// ─── FORMS ────────────────────────────────────────────────────────────────────

export interface CreateProjectForm {
  name: string
  type: string
  description?: string
  clientProfileId?: string
  projectManagerId?: string
  projectHeadId?: string
  proposedBudget?: number
  currency?: string
  startDate?: string
  expectedEndDate?: string
  useTemplate: boolean
  templateId?: string
}

export interface CreateTaskForm {
  title: string
  description?: string
  priority: string
  phase: string
  assigneeId?: string
  dueDate?: string
  estimatedHours?: number
  parentTaskId?: string
}

export interface PublishUpdateForm {
  title: string
  content: string
  phase: string
  attachments?: File[]
}

export interface ChangeRequestForm {
  title: string
  description: string
  type: string
  estimatedCost?: number
}

export interface HandoverForm {
  liveUrl?: string
  stagingUrl?: string
  repositoryUrl?: string
  deploymentPlatform?: string
  deploymentNotes?: string
  credentialsNotes?: string
  maintenanceNotes?: string
}

// ─── GROWTH TREE ─────────────────────────────────────────────────────────────

export type TreeStage = 'seed' | 'sapling' | 'young' | 'mature' | 'full'

export interface TreeConfig {
  stage: TreeStage
  progress: number // 0-100
  health: string
  label: string
  description: string
}

export function getTreeStage(progress: number): TreeStage {
  if (progress < 20) return 'seed'
  if (progress < 40) return 'sapling'
  if (progress < 60) return 'young'
  if (progress < 85) return 'mature'
  return 'full'
}

export function getTreeConfig(progress: number, health: string): TreeConfig {
  const stage = getTreeStage(progress)
  
  const configs: Record<TreeStage, Omit<TreeConfig, 'stage' | 'progress' | 'health'>> = {
    seed: { label: 'Getting Started', description: 'Your project has been planted' },
    sapling: { label: 'Taking Shape', description: 'Requirements gathered, building begins' },
    young: { label: 'Growing Strong', description: 'Core features taking form' },
    mature: { label: 'Almost There', description: 'Refinement and polish underway' },
    full: { label: 'In Full Bloom', description: 'Ready for launch' },
  }
  
  return { stage, progress, health, ...configs[stage] }
}

// ─── CLIENT-FACING PHASES ─────────────────────────────────────────────────────

export const CLIENT_PHASE_LABELS: Record<string, string> = {
  REQUIREMENTS_COLLECTION: 'Requirements Collection',
  PLANNING: 'Planning',
  BUILDING: 'Building Your Project',
  REVIEW_FEEDBACK: 'Review & Feedback',
  LAUNCH: 'Launch',
}

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  BUSINESS_WEBSITE: 'Business Website',
  ECOMMERCE_WEBSITE: 'E-commerce Website',
  PORTFOLIO_WEBSITE: 'Portfolio Website',
  CATALOGUE_WEBSITE: 'Catalogue Website',
  MOBILE_APP: 'Mobile App',
  SAAS: 'SaaS Platform',
  CRM: 'CRM System',
  ERP: 'ERP System',
  CUSTOM_PRODUCT: 'Custom Product',
}

export const HEALTH_COLORS: Record<string, string> = {
  ON_TRACK: 'green',
  WAITING_FOR_CLIENT: 'amber',
  AT_RISK: 'orange',
  DELAYED: 'red',
}

export const HEALTH_LABELS: Record<string, string> = {
  ON_TRACK: 'On Track',
  WAITING_FOR_CLIENT: 'Waiting for Client',
  AT_RISK: 'At Risk',
  DELAYED: 'Delayed',
}
