'use client'
// app/(dashboard)/dev/DevTasksClient.tsx
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TaskStatusBadge, PriorityBadge } from '@/components/projects/HealthBadge'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { CheckSquare, Clock, AlertTriangle, ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'Mark In Progress' },
  { value: 'IN_REVIEW', label: 'Submit for Review' },
  { value: 'BLOCKED', label: 'Mark as Blocked' },
]

interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  phase: string
  dueDate?: Date | null
  estimatedHours?: number | null
  actualHours?: number | null
  project: { id: string; name: string; slug: string }
}

interface Props {
  tasks: Task[]
  stats: { total: number; inProgress: number; inReview: number; overdue: number; done: number }
  userId: string
}

export default function DevTasksClient({ tasks: initialTasks, stats, userId }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<string>('active')
  const [pending, startTransition] = useTransition()
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !['DONE', 'APPROVED'].includes(t.status)
    if (filter === 'review') return t.status === 'IN_REVIEW'
    if (filter === 'done') return ['DONE', 'APPROVED'].includes(t.status)
    return true
  })

  async function updateTaskStatus(taskId: string, newStatus: string, projectId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        toast.error('Failed to update task')
        return
      }

      const data = await res.json()
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: data.data.status } : t))
      setOpenTaskId(null)

      if (newStatus === 'IN_REVIEW') {
        toast.success('Task submitted for review')
      } else {
        toast.success('Task updated')
      }
    })
  }

  const PHASE_LABELS: Record<string, string> = {
    REQUIREMENTS_COLLECTION: 'Requirements',
    PLANNING: 'Planning',
    BUILDING: 'Building',
    REVIEW_FEEDBACK: 'Review',
    LAUNCH: 'Launch',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>My Tasks</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Tasks assigned to you across all projects
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}
        className="max-sm:grid-cols-2"
      >
        {[
          { label: 'In progress', value: stats.inProgress, color: 'var(--blue)' },
          { label: 'In review', value: stats.inReview, color: 'var(--amber)' },
          { label: 'Overdue', value: stats.overdue, color: 'var(--red)' },
          { label: 'Completed', value: stats.done, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, letterSpacing: '-0.5px' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[
          { key: 'active', label: 'Active', count: tasks.filter(t => !['DONE', 'APPROVED'].includes(t.status)).length },
          { key: 'review', label: 'In Review', count: stats.inReview },
          { key: 'done', label: 'Done', count: stats.done },
          { key: 'all', label: 'All', count: stats.total },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: filter === tab.key ? '600' : '400',
              color: filter === tab.key ? 'var(--text)' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${filter === tab.key ? 'var(--accent)' : 'transparent'}`,
              cursor: 'pointer',
              gap: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                background: filter === tab.key ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
                color: filter === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: '100px',
                padding: '1px 6px',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <CheckSquare size={28} color="var(--text-tertiary)" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No tasks here</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['DONE', 'APPROVED'].includes(task.status)
            const isOpen = openTaskId === task.id

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  padding: '16px',
                  borderColor: isOverdue ? 'rgba(220, 38, 38, 0.2)' : 'var(--border)',
                  background: isOverdue ? 'var(--red-bg)' : 'var(--bg)',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {/* Status indicator */}
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '100%',
                    flexShrink: 0,
                    marginTop: '4px',
                    background: {
                      TODO: 'var(--border-strong)',
                      IN_PROGRESS: 'var(--blue)',
                      IN_REVIEW: 'var(--amber)',
                      APPROVED: 'var(--green)',
                      DONE: 'var(--green)',
                      BLOCKED: 'var(--red)',
                    }[task.status] || 'var(--border-strong)',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', lineHeight: 1.3, marginBottom: '5px' }}>
                          {task.title}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '100px' }}>
                            {task.project.name}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {PHASE_LABELS[task.phase]}
                          </span>
                          <PriorityBadge priority={task.priority} />
                          <TaskStatusBadge status={task.status} />
                        </div>
                      </div>

                      {/* Actions */}
                      {!['DONE', 'APPROVED'].includes(task.status) && (
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setOpenTaskId(isOpen ? null : task.id)}
                            style={{ gap: '4px' }}
                          >
                            Update
                            <ChevronDown size={12} />
                          </button>
                          {isOpen && (
                            <div style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              right: 0,
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius)',
                              boxShadow: 'var(--shadow-md)',
                              zIndex: 10,
                              minWidth: '180px',
                              overflow: 'hidden',
                            }}>
                              {STATUS_OPTIONS.filter(o => o.value !== task.status).map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateTaskStatus(task.id, opt.value, task.project.id)}
                                  disabled={pending}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '13px',
                                    color: 'var(--text)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.1s',
                                  }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Due date */}
                    {task.dueDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                        <Clock size={12} color={isOverdue ? 'var(--red)' : 'var(--text-tertiary)'} />
                        <span style={{ fontSize: '12px', color: isOverdue ? 'var(--red)' : 'var(--text-tertiary)' }}>
                          {isOverdue ? 'Overdue · ' : 'Due '}
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}

                    {/* Description preview */}
                    {task.description && (
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginTop: '8px',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                      }}>
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
