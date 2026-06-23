// components/projects/HealthBadge.tsx
import { HEALTH_LABELS } from '@/types'

const HEALTH_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  ON_TRACK: { label: 'On Track', cls: 'badge-green', dot: 'var(--green)' },
  WAITING_FOR_CLIENT: { label: 'Waiting for Client', cls: 'badge-amber', dot: 'var(--amber)' },
  AT_RISK: { label: 'At Risk', cls: 'badge-red', dot: 'var(--red)' },
  DELAYED: { label: 'Delayed', cls: 'badge-red', dot: 'var(--red)' },
}

export function HealthBadge({ health }: { health: string }) {
  const config = HEALTH_CONFIG[health] || HEALTH_CONFIG.ON_TRACK
  return (
    <span className={`badge ${config.cls}`}>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '100%',
        background: config.dot,
        flexShrink: 0,
      }} />
      {config.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: 'Draft', cls: 'badge-gray' },
    PROPOSAL: { label: 'Proposal', cls: 'badge-blue' },
    AWAITING_PAYMENT: { label: 'Awaiting Payment', cls: 'badge-amber' },
    ACTIVE: { label: 'Active', cls: 'badge-green' },
    ON_HOLD: { label: 'On Hold', cls: 'badge-amber' },
    REVIEW: { label: 'In Review', cls: 'badge-blue' },
    COMPLETED: { label: 'Completed', cls: 'badge-green' },
    ARCHIVED: { label: 'Archived', cls: 'badge-gray' },
    CANCELLED: { label: 'Cancelled', cls: 'badge-red' },
  }

  const config = STATUS_CONFIG[status] || { label: status, cls: 'badge-gray' }
  return <span className={`badge ${config.cls}`}>{config.label}</span>
}

export function PhaseBadge({ phase }: { phase: string }) {
  const PHASE_CONFIG: Record<string, string> = {
    REQUIREMENTS_COLLECTION: 'Requirements',
    PLANNING: 'Planning',
    BUILDING: 'Building',
    REVIEW_FEEDBACK: 'Review & Feedback',
    LAUNCH: 'Launch',
  }
  return (
    <span className="badge badge-blue">
      {PHASE_CONFIG[phase] || phase}
    </span>
  )
}

export function TaskStatusBadge({ status }: { status: string }) {
  const CONFIG: Record<string, { label: string; cls: string }> = {
    TODO: { label: 'To Do', cls: 'badge-gray' },
    IN_PROGRESS: { label: 'In Progress', cls: 'badge-blue' },
    IN_REVIEW: { label: 'In Review', cls: 'badge-amber' },
    APPROVED: { label: 'Approved', cls: 'badge-green' },
    DONE: { label: 'Done', cls: 'badge-green' },
    BLOCKED: { label: 'Blocked', cls: 'badge-red' },
  }
  const config = CONFIG[status] || { label: status, cls: 'badge-gray' }
  return <span className={`badge ${config.cls}`}>{config.label}</span>
}

export function PriorityBadge({ priority }: { priority: string }) {
  const CONFIG: Record<string, { label: string; cls: string }> = {
    LOW: { label: 'Low', cls: 'badge-gray' },
    MEDIUM: { label: 'Medium', cls: 'badge-blue' },
    HIGH: { label: 'High', cls: 'badge-amber' },
    CRITICAL: { label: 'Critical', cls: 'badge-red' },
  }
  const config = CONFIG[priority] || { label: priority, cls: 'badge-gray' }
  return <span className={`badge ${config.cls}`}>{config.label}</span>
}
