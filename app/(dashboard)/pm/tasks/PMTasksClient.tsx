'use client'
// app/(dashboard)/pm/tasks/PMTasksClient.tsx
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { TaskStatusBadge, PriorityBadge } from '@/components/projects/HealthBadge'
import { formatDate, getInitials } from '@/lib/utils'
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DONE', label: 'Done' },
  { value: 'BLOCKED', label: 'Blocked' },
]

const PHASE_OPTIONS = [
  { value: '', label: 'All phases' },
  { value: 'REQUIREMENTS_COLLECTION', label: 'Requirements' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'BUILDING', label: 'Building' },
  { value: 'REVIEW_FEEDBACK', label: 'Review & Feedback' },
  { value: 'LAUNCH', label: 'Launch' },
]

interface Task {
  id: string
  title: string
  status: string
  priority: string
  phase: string
  dueDate?: Date | string | null
  assignee?: { id: string; name: string; avatar?: string | null } | null
  project: { id: string; name: string }
}

interface Props {
  tasks: Task[]
  projects: { id: string; name: string }[]
  developers: { id: string; name: string }[]
  filters: { status?: string; phase?: string; assigneeId?: string; projectId?: string }
}

export default function PMTasksClient({ tasks, projects, developers, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set(key, value) : params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  async function updateTaskStatus(taskId: string, projectId: string, newStatus: string) {
    setUpdatingId(taskId)
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      toast.success('Task updated')
      router.refresh()
    } else {
      toast.error('Failed to update task')
    }
    setUpdatingId(null)
  }

  const now = new Date()
  const overdueTasks = tasks.filter(
    t => t.dueDate && new Date(t.dueDate) < now && !['DONE', 'APPROVED'].includes(t.status)
  )
  const inReview = tasks.filter(t => t.status === 'IN_REVIEW')
  const blocked = tasks.filter(t => t.status === 'BLOCKED')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Tasks</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} across all projects
        </p>
      </div>

      {/* Alert row */}
      {(overdueTasks.length > 0 || inReview.length > 0 || blocked.length > 0) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {overdueTasks.length > 0 && (
            <button
              onClick={() => updateFilter('status', '')}
              style={{
                display: 'flex', gap: '8px', alignItems: 'center',
                padding: '8px 14px', borderRadius: 'var(--radius)',
                background: 'var(--red-bg)', border: '1px solid rgba(220,38,38,0.15)',
                color: 'var(--red)', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <AlertTriangle size={13} />
              {overdueTasks.length} overdue
            </button>
          )}
          {inReview.length > 0 && (
            <button
              onClick={() => updateFilter('status', 'IN_REVIEW')}
              style={{
                display: 'flex', gap: '8px', alignItems: 'center',
                padding: '8px 14px', borderRadius: 'var(--radius)',
                background: 'var(--amber-bg)', border: '1px solid rgba(217,119,6,0.15)',
                color: 'var(--amber)', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <Clock size={13} />
              {inReview.length} awaiting review
            </button>
          )}
          {blocked.length > 0 && (
            <button
              onClick={() => updateFilter('status', 'BLOCKED')}
              style={{
                display: 'flex', gap: '8px', alignItems: 'center',
                padding: '8px 14px', borderRadius: 'var(--radius)',
                background: 'var(--red-bg)', border: '1px solid rgba(220,38,38,0.15)',
                color: 'var(--red)', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <AlertTriangle size={13} />
              {blocked.length} blocked
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto', minWidth: '140px' }}
          value={filters.status || ''}
          onChange={e => updateFilter('status', e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: '150px' }}
          value={filters.phase || ''}
          onChange={e => updateFilter('phase', e.target.value)}>
          {PHASE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: '160px' }}
          value={filters.projectId || ''}
          onChange={e => updateFilter('projectId', e.target.value)}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: '150px' }}
          value={filters.assigneeId || ''}
          onChange={e => updateFilter('assigneeId', e.target.value)}>
          <option value="">All developers</option>
          {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Tasks table */}
      {tasks.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <CheckSquare size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No tasks found</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {tasks.map((task, i) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < now && !['DONE', 'APPROVED'].includes(task.status)
            const isUpdating = updatingId === task.id

            return (
              <div
                key={task.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isOverdue ? 'var(--red-bg)' : 'transparent',
                  opacity: isUpdating ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Title + project */}
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px', fontWeight: '500', color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '3px',
                  }}>
                    {task.title}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px', color: 'var(--text-tertiary)',
                      background: 'var(--bg-tertiary)', padding: '1px 7px', borderRadius: '100px',
                    }}>
                      {task.project.name}
                    </span>
                    {task.dueDate && (
                      <span style={{ fontSize: '11px', color: isOverdue ? 'var(--red)' : 'var(--text-tertiary)' }}>
                        {isOverdue ? '⚠ ' : ''}Due {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignee */}
                {task.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '100%',
                      background: 'var(--accent-muted)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', fontWeight: '700', flexShrink: 0,
                    }}>
                      {getInitials(task.assignee.name)}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {task.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Unassigned</span>
                )}

                <PriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />

                {/* Quick status update — PM can approve IN_REVIEW tasks */}
                {task.status === 'IN_REVIEW' && (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--green)', color: '#fff', height: '28px', padding: '0 10px', fontSize: '12px' }}
                      onClick={() => updateTaskStatus(task.id, task.project.id, 'APPROVED')}
                      disabled={isUpdating}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ height: '28px', padding: '0 8px', fontSize: '12px', color: 'var(--text-secondary)' }}
                      onClick={() => updateTaskStatus(task.id, task.project.id, 'IN_PROGRESS')}
                      disabled={isUpdating}
                    >
                      Return
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
