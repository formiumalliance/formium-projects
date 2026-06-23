// app/(dashboard)/pm/projects/[id]/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { HealthBadge, StatusBadge, PhaseBadge, TaskStatusBadge, PriorityBadge } from '@/components/projects/HealthBadge'
import { formatDate, formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils'
import { ArrowLeft, Plus, Users, Calendar, DollarSign, GitBranch } from 'lucide-react'
import ProjectActionsClient from './ProjectActionsClient'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await requireRole([
    UserRole.PROJECT_MANAGER,
    UserRole.SUPER_ADMIN,
    UserRole.PROJECT_HEAD,
    UserRole.BUSINESS_GROWTH_MANAGER,
  ])

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      projectManager: { select: { id: true, name: true, avatar: true, email: true } },
      projectHead: { select: { id: true, name: true, avatar: true, email: true } },
      bgm: { select: { id: true, name: true } },
      clientProfile: {
        include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } },
      },
      developers: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [{ phase: 'asc' }, { sortOrder: 'asc' }],
      },
      updates: {
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        include: { publishedBy: { select: { name: true } }, _count: { select: { comments: true } } },
      },
      milestones: { orderBy: { sortOrder: 'asc' } },
      requirements: { orderBy: { sortOrder: 'asc' } },
      changeRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
      _count: { select: { tasks: true, updates: true, changeRequests: true, documents: true } },
    },
  })

  if (!project) notFound()

  const tasksByPhase = project.tasks.reduce((acc: any, task) => {
    if (!acc[task.phase]) acc[task.phase] = []
    acc[task.phase].push(task)
    return acc
  }, {})

  const PHASE_LABELS: Record<string, string> = {
    REQUIREMENTS_COLLECTION: 'Requirements',
    PLANNING: 'Planning',
    BUILDING: 'Building',
    REVIEW_FEEDBACK: 'Review & Feedback',
    LAUNCH: 'Launch',
  }

  const doneTasks = project.tasks.filter(t => ['DONE', 'APPROVED'].includes(t.status)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      {/* Back nav */}
      <div>
        <Link
          href="/pm/projects"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px', textDecoration: 'none' }}
        >
          <ArrowLeft size={13} />
          Projects
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <StatusBadge status={project.status} />
              <PhaseBadge phase={project.phase} />
              <HealthBadge health={project.health} />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>{project.name}</h1>
            {project.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                {project.description}
              </p>
            )}
          </div>
          <ProjectActionsClient project={project} />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="progress-bar" style={{ flex: 1, height: '6px' }}>
          <div className="progress-fill" style={{ width: `${project.progress}%` }} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', minWidth: '36px' }}>
          {project.progress}%
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {doneTasks}/{project.tasks.length} tasks
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}
        className="max-lg:grid-cols-1"
      >
        {/* Tasks by phase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(PHASE_LABELS).map(([phase, phaseLabel]) => {
            const phaseTasks = tasksByPhase[phase] || []
            if (phaseTasks.length === 0) return null
            const doneInPhase = phaseTasks.filter((t: any) => ['DONE', 'APPROVED'].includes(t.status)).length

            return (
              <div key={phase} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-secondary)',
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{phaseLabel}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {doneInPhase}/{phaseTasks.length}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ width: '80px' }}>
                    <div className="progress-fill" style={{ width: `${phaseTasks.length ? (doneInPhase / phaseTasks.length) * 100 : 0}%` }} />
                  </div>
                </div>

                {phaseTasks.map((task: any, i: number) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: '10px',
                      alignItems: 'center',
                      padding: '11px 16px',
                      borderBottom: i < phaseTasks.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: ['DONE', 'APPROVED'].includes(task.status) ? 'var(--text-tertiary)' : 'var(--text)',
                        textDecoration: ['DONE', 'APPROVED'].includes(task.status) ? 'line-through' : 'none',
                        marginBottom: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {task.title}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {task.assignee && (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {task.assignee.name}
                          </span>
                        )}
                        {task.dueDate && (
                          <span style={{
                            fontSize: '11px',
                            color: new Date(task.dueDate) < new Date() && !['DONE', 'APPROVED'].includes(task.status)
                              ? 'var(--red)'
                              : 'var(--text-tertiary)',
                          }}>
                            Due {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <PriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )
          })}

          {/* Add task button */}
          <Link
            href={`/pm/projects/${project.id}/tasks/new`}
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-start', gap: '6px' }}
          >
            <Plus size={14} />
            Add task
          </Link>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Project info */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
              Project info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Client', value: project.clientProfile?.user?.name || '—' },
                { label: 'PM', value: project.projectManager?.name || '—' },
                { label: 'Project Head', value: project.projectHead?.name || '—' },
                { label: 'Start', value: project.startDate ? formatDate(project.startDate) : '—' },
                { label: 'Expected end', value: project.expectedEndDate ? formatDate(project.expectedEndDate) : '—' },
                { label: 'Budget', value: project.agreedBudget ? formatCurrency(project.agreedBudget) : '—' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Developers
              </h3>
              <Link href={`/pm/projects/${project.id}/team`} style={{ fontSize: '12px', color: 'var(--accent)' }}>
                Manage
              </Link>
            </div>
            {project.developers.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>No developers assigned</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project.developers.map(d => (
                  <div key={d.user.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="avatar avatar-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '10px' }}>
                      {getInitials(d.user.name)}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text)' }}>{d.user.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestones */}
          {project.milestones.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Milestones
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project.milestones.map(ms => (
                  <div key={ms.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '100%',
                      border: `2px solid ${ms.isCompleted ? 'var(--green)' : 'var(--border-strong)'}`,
                      background: ms.isCompleted ? 'var(--green)' : 'transparent',
                      flexShrink: 0,
                    }} />
                    <div>
                      <p style={{ fontSize: '12px', color: ms.isCompleted ? 'var(--text-tertiary)' : 'var(--text)', fontWeight: '500', textDecoration: ms.isCompleted ? 'line-through' : 'none' }}>
                        {ms.title}
                      </p>
                      {ms.dueDate && (
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {formatDate(ms.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent updates */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Updates
              </h3>
              <Link href={`/pm/projects/${project.id}/updates`} style={{ fontSize: '12px', color: 'var(--accent)' }}>
                View all
              </Link>
            </div>
            {project.updates.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>No updates posted</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project.updates.map(update => (
                  <div key={update.id}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>{update.title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {update.publishedBy.name} · {update.publishedAt ? formatRelativeTime(update.publishedAt) : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
