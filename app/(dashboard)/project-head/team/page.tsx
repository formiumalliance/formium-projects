// app/(dashboard)/project-head/team/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import { getInitials } from '@/lib/utils'
import { Users } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  PROJECT_MANAGER: 'Project Manager',
  DEVELOPER:       'Developer',
}

export default async function ProjectHeadTeamPage() {
  await requireRole([UserRole.PROJECT_HEAD, UserRole.SUPER_ADMIN])

  const team = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.PROJECT_MANAGER, UserRole.DEVELOPER] },
      isActive: true,
    },
    include: {
      projectsAsPM: {
        where: { isArchived: false, status: 'ACTIVE' },
        select: { id: true, name: true, health: true, progress: true },
      },
      developerAssignments: {
        where: { isActive: true, project: { isArchived: false, status: 'ACTIVE' } },
        include: {
          project: { select: { id: true, name: true, health: true, progress: true } },
        },
      },
      tasksAssigned: {
        where: {
          status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] },
          project: { isArchived: false },
        },
        select: { status: true },
      },
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const pms   = team.filter(u => u.role === UserRole.PROJECT_MANAGER)
  const devs  = team.filter(u => u.role === UserRole.DEVELOPER)

  function WorkloadBar({ count, max }: { count: number; max: number }) {
    const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0
    const color = pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--amber)' : 'var(--green)'
    return (
      <div className="progress-bar" style={{ width: '60px', height: '5px' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: '100px',
          transition: 'width 0.4s ease',
        }} />
      </div>
    )
  }

  function MemberCard({ member }: { member: typeof team[0] }) {
    const isPM   = member.role === UserRole.PROJECT_MANAGER
    const projs  = isPM
      ? member.projectsAsPM
      : member.developerAssignments.map(a => a.project)
    const openTasks = member.tasksAssigned.filter(t => !['DONE','APPROVED'].includes(t.status)).length
    const blockedTasks = member.tasksAssigned.filter(t => t.status === 'BLOCKED').length

    return (
      <div className="card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div className="avatar" style={{
            width: '40px', height: '40px', fontSize: '14px', fontWeight: '700',
            background: isPM ? 'var(--blue-bg)' : 'var(--accent-muted)',
            color: isPM ? 'var(--blue)' : 'var(--accent)',
            flexShrink: 0,
          }}>
            {getInitials(member.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>
              {member.name}
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`badge ${isPM ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '10px' }}>
                {ROLE_LABELS[member.role]}
              </span>
              {blockedTasks > 0 && (
                <span className="badge badge-red" style={{ fontSize: '10px' }}>
                  {blockedTasks} blocked
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', lineHeight: 1 }}>
              {projs.length}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              active {isPM ? 'projects' : 'projects'}
            </p>
          </div>
        </div>

        {openTasks > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{openTasks} open tasks</span>
            <WorkloadBar count={openTasks} max={isPM ? 30 : 15} />
          </div>
        )}

        {projs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {projs.slice(0, 3).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '100%', flexShrink: 0,
                  background: {
                    ON_TRACK:           'var(--green)',
                    WAITING_FOR_CLIENT: 'var(--amber)',
                    AT_RISK:            'var(--red)',
                    DELAYED:            'var(--red)',
                  }[p.health] || 'var(--border-strong)',
                }} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {p.name}
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {p.progress}%
                </span>
              </div>
            ))}
            {projs.length > 3 && (
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '14px' }}>
                +{projs.length - 3} more
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Users size={20} color="var(--text-secondary)" />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Team</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            {pms.length} PM{pms.length !== 1 ? 's' : ''} · {devs.length} developer{devs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {pms.length > 0 && (
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
            Project Managers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {pms.map(m => <MemberCard key={m.id} member={m} />)}
          </div>
        </div>
      )}

      {devs.length > 0 && (
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
            Developers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {devs.map(m => <MemberCard key={m.id} member={m} />)}
          </div>
        </div>
      )}

      {team.length === 0 && (
        <div className="empty-state">
          <Users size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No team members yet</p>
        </div>
      )}
    </div>
  )
}
