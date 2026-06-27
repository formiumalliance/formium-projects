export const dynamic = 'force-dynamic'
// app/(dashboard)/dev/projects/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { HealthBadge, PhaseBadge } from '@/components/projects/HealthBadge'
import { FolderKanban } from 'lucide-react'

export default async function DevProjectsPage() {
  const session = await requireRole([UserRole.DEVELOPER])

  const assignments = await prisma.projectDeveloper.findMany({
    where: {
      userId:   session.user.id,
      isActive: true,
      project:  { isArchived: false },
    },
    include: {
      project: {
        include: {
          projectManager: { select: { name: true, email: true } },
          clientProfile:  { include: { user: { select: { name: true } } } },
          tasks: {
            where: { assigneeId: session.user.id },
            select: { status: true },
          },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  })

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>My Projects</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {assignments.length} project{assignments.length !== 1 ? 's' : ''} you're assigned to
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <FolderKanban size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No projects yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            You'll appear here when assigned to a project.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {assignments.map(({ project: p, role, assignedAt }) => {
            const myTasks     = p.tasks
            const doneTasks   = myTasks.filter(t => ['DONE','APPROVED'].includes(t.status)).length
            const openTasks   = myTasks.filter(t => !['DONE','APPROVED'].includes(t.status)).length
            const blockedTasks = myTasks.filter(t => t.status === 'BLOCKED').length

            return (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
                        {p.name}
                      </h2>
                      {role && (
                        <span className="badge badge-gray" style={{ fontSize: '11px' }}>{role}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <HealthBadge health={p.health} />
                      <PhaseBadge  phase={p.phase}  />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', lineHeight: 1 }}>
                      {p.progress}%
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>complete</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="progress-bar" style={{ marginBottom: '14px', height: '5px' }}>
                  <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {[
                    { label: 'Open tasks',  value: openTasks,    color: 'var(--text)'  },
                    { label: 'Done',        value: doneTasks,    color: 'var(--green)' },
                    ...(blockedTasks > 0 ? [{ label: 'Blocked', value: blockedTasks, color: 'var(--red)' }] : []),
                  ].map(s => (
                    <div key={s.label}>
                      <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    PM: {p.projectManager?.name || '—'}
                    {p.expectedEndDate && ` · Due ${formatDate(p.expectedEndDate)}`}
                    {` · Joined ${formatDate(assignedAt)}`}
                  </div>
                  <Link
                    href={`/dev/projects/${p.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    View project →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
