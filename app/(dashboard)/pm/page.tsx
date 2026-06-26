export const dynamic = 'force-dynamic'
// app/(dashboard)/pm/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { HealthBadge, StatusBadge, PhaseBadge } from '@/components/projects/HealthBadge'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { UserRole } from '@prisma/client'
import { AlertTriangle, Clock, CheckCircle2, FolderKanban } from 'lucide-react'

export default async function PMDashboardPage() {
  const session = await requireRole([
    UserRole.PROJECT_MANAGER,
    UserRole.SUPER_ADMIN,
    UserRole.PROJECT_HEAD,
  ])

  const isAdmin = [UserRole.SUPER_ADMIN as string, UserRole.PROJECT_HEAD as string].includes(session.user.role)

  const projects = await prisma.project.findMany({
    where: {
      isArchived: false,
      ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
    },
    include: {
      projectManager: { select: { id: true, name: true, avatar: true } },
      clientProfile: { include: { user: { select: { name: true } } } },
      tasks: { select: { status: true } },
      _count: { select: { updates: true, changeRequests: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  // Stats
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    atRisk: projects.filter(p => ['AT_RISK', 'DELAYED'].includes(p.health)).length,
    waitingClient: projects.filter(p => p.health === 'WAITING_FOR_CLIENT').length,
  }

  // Overdue tasks (PM's projects)
  const overdueTasks = await prisma.task.findMany({
    where: {
      project: {
        isArchived: false,
        ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
      },
      status: { notIn: ['DONE', 'APPROVED'] },
      dueDate: { lt: new Date() },
    },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  // Pending change requests
  const pendingCRs = await prisma.changeRequest.findMany({
    where: {
      status: 'PENDING',
      project: {
        isArchived: false,
        ...(!isAdmin ? { projectManagerId: session.user.id } : {}),
      },
    },
    include: { project: { select: { name: true, slug: true } } },
    take: 5,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>
          {isAdmin ? 'All Projects' : 'My Projects'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}
        className="max-sm:grid-cols-2"
      >
        {[
          { label: 'Total projects', value: stats.total, icon: FolderKanban, color: 'var(--text)' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'var(--green)' },
          { label: 'At risk / Delayed', value: stats.atRisk, icon: AlertTriangle, color: 'var(--red)' },
          { label: 'Waiting for client', value: stats.waitingClient, icon: Clock, color: 'var(--amber)' },
        ].map(stat => (
          <div key={stat.label} className="card card-sm" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <stat.icon size={16} color={stat.color} strokeWidth={1.75} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.8px', color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}
        className="max-lg:grid-cols-1"
      >
        {/* Projects list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Projects</h2>
            <Link href="/pm/projects" style={{ fontSize: '13px', color: 'var(--accent)' }}>
              View all →
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state">
              <FolderKanban size={32} color="var(--text-tertiary)" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No projects assigned</p>
            </div>
          ) : (
            <div>
              {projects.slice(0, 8).map((project, i) => {
                const doneTasks = project.tasks.filter(t => ['DONE', 'APPROVED'].includes(t.status)).length
                const totalTasks = project.tasks.length

                return (
                  <Link
                    key={project.id}
                    href={`/pm/projects/${project.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 20px',
                      borderBottom: i < projects.slice(0, 8).length - 1 ? '1px solid var(--border)' : 'none',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {/* Health indicator */}
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '100%',
                      background: {
                        ON_TRACK: 'var(--green)',
                        WAITING_FOR_CLIENT: 'var(--amber)',
                        AT_RISK: 'var(--red)',
                        DELAYED: 'var(--red)',
                      }[project.health] || 'var(--text-tertiary)',
                      flexShrink: 0,
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '3px',
                      }}>
                        {project.name}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {project.clientProfile?.user?.name}
                        {totalTasks > 0 && ` · ${doneTasks}/${totalTasks} tasks`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <div style={{ width: '60px', textAlign: 'right' }}>
                        <div className="progress-bar" style={{ height: '3px' }}>
                          <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                          {project.progress}%
                        </p>
                      </div>
                      <PhaseBadge phase={project.phase} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Overdue tasks */}
          {overdueTasks.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <AlertTriangle size={14} color="var(--red)" />
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                  Overdue tasks ({overdueTasks.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overdueTasks.map(task => (
                  <div key={task.id} style={{
                    padding: '10px 12px',
                    background: 'var(--red-bg)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid rgba(220, 38, 38, 0.12)',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '3px' }}>
                      {task.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {task.project.name}
                      {task.assignee && ` · ${task.assignee.name}`}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: '3px' }}>
                      Due {formatDate(task.dueDate!)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending change requests */}
          {pendingCRs.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <Clock size={14} color="var(--amber)" />
                <h3 style={{ fontSize: '13px', fontWeight: '600' }}>
                  Pending change requests ({pendingCRs.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pendingCRs.map(cr => (
                  <Link
                    key={cr.id}
                    href={`/pm/projects/${cr.project.slug}/change-requests`}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      background: 'var(--amber-bg)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid rgba(217, 119, 6, 0.15)',
                      textDecoration: 'none',
                    }}
                  >
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '3px' }}>
                      {cr.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {cr.project.name} · Awaiting decision
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
