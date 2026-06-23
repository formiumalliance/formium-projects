// app/(dashboard)/project-head/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { HealthBadge, StatusBadge } from '@/components/projects/HealthBadge'
import { formatDate, formatCurrency, formatRelativeTime } from '@/lib/utils'
import { Users, AlertTriangle, GitBranch, CheckCircle2, Package } from 'lucide-react'

export default async function ProjectHeadDashboardPage() {
  await requireRole([UserRole.PROJECT_HEAD, UserRole.SUPER_ADMIN])

  const [projects, pendingCRs, pendingHandovers, team] = await Promise.all([
    prisma.project.findMany({
      where: { isArchived: false },
      include: {
        projectManager: { select: { name: true } },
        clientProfile: { include: { user: { select: { name: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 15,
    }),
    prisma.changeRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        project: { select: { name: true, id: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.handover.findMany({
      where: { status: 'PREPARING' },
      include: {
        project: { select: { name: true, id: true, projectManagerId: true } },
      },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        role: { in: [UserRole.PROJECT_MANAGER, UserRole.DEVELOPER] },
        isActive: true,
      },
      select: {
        id: true, name: true, role: true, avatar: true,
        _count: {
          select: {
            projectsAsPM: { where: { isArchived: false, status: 'ACTIVE' } },
            developerAssignments: { where: { isActive: true } },
          },
        },
      },
    }),
  ])

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    atRisk: projects.filter(p => ['AT_RISK', 'DELAYED'].includes(p.health)).length,
    pendingCRs: pendingCRs.length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>
          Project Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          All projects, team health and pending decisions
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}
        className="max-sm:grid-cols-2"
      >
        {[
          { label: 'Total projects', value: stats.total, icon: CheckCircle2, color: 'var(--text)' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'var(--green)' },
          { label: 'At risk / Delayed', value: stats.atRisk, icon: AlertTriangle, color: 'var(--red)' },
          { label: 'CR decisions needed', value: stats.pendingCRs, icon: GitBranch, color: stats.pendingCRs > 0 ? 'var(--amber)' : 'var(--text)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
              <stat.icon size={14} color={stat.color} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: stat.color, letterSpacing: '-0.8px' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}
        className="max-lg:grid-cols-1"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Projects table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600' }}>All Projects</h2>
              <Link href="/project-head/projects" style={{ fontSize: '13px', color: 'var(--accent)' }}>View all →</Link>
            </div>
            {projects.map((p, i) => (
              <Link
                key={p.id}
                href={`/project-head/projects/${p.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '13px 20px',
                  borderBottom: i < projects.length - 1 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {p.clientProfile?.user?.name}
                    {p.projectManager && ` · ${p.projectManager.name}`}
                  </p>
                </div>
                <HealthBadge health={p.health} />
                <StatusBadge status={p.status} />
                <p style={{ fontSize: '13px', fontWeight: '600', minWidth: '36px', textAlign: 'right', color: 'var(--text)' }}>
                  {p.progress}%
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pending CRs - needs decision */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <GitBranch size={14} color="var(--amber)" />
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>
                Pending decisions ({pendingCRs.length})
              </h3>
            </div>
            {pendingCRs.length === 0 ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 0' }}>
                <CheckCircle2 size={14} color="var(--green)" />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>All clear</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pendingCRs.map(cr => (
                  <Link
                    key={cr.id}
                    href={`/project-head/change-requests`}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      background: 'var(--amber-bg)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid rgba(217, 119, 6, 0.15)',
                      textDecoration: 'none',
                    }}
                  >
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>
                      {cr.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {cr.project.name} · Awaiting your decision
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Team load */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <Users size={14} />
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Team load</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {team.slice(0, 8).map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="avatar avatar-sm" style={{
                    background: 'var(--accent-muted)',
                    color: 'var(--accent)',
                    fontWeight: '700',
                    fontSize: '10px',
                    width: '28px',
                    height: '28px',
                  }}>
                    {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {member.role === 'PROJECT_MANAGER' ? 'PM' : 'Dev'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-tertiary)',
                    padding: '2px 8px',
                    borderRadius: '100px',
                  }}>
                    {member.role === 'PROJECT_MANAGER'
                      ? member._count.projectsAsPM
                      : member._count.developerAssignments}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Handovers in prep */}
          {pendingHandovers.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <Package size={14} />
                <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Handovers in prep</h3>
              </div>
              {pendingHandovers.map(h => (
                <Link
                  key={h.id}
                  href={`/project-head/handovers`}
                  style={{
                    display: 'block',
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '6px',
                    textDecoration: 'none',
                  }}
                >
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                    {h.project.name}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Preparing handover</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
