// app/(dashboard)/super-admin/page.tsx
import { requireAdminRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { HealthBadge, StatusBadge } from '@/components/projects/HealthBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Users, FolderKanban, TrendingUp, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'

export default async function SuperAdminDashboardPage() {
  await requireAdminRole()

  const [
    projectStats,
    userStats,
    recentProjects,
    pendingCRs,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.project.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { isArchived: false },
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      where: { isActive: true },
    }),
    prisma.project.findMany({
      where: { isArchived: false },
      include: {
        projectManager: { select: { name: true } },
        clientProfile: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.changeRequest.findMany({
      where: { status: 'PENDING' },
      include: { project: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const totalProjects = projectStats.reduce((s, p) => s + p._count.id, 0)
  const activeProjects = projectStats.find(p => p.status === 'ACTIVE')?._count.id || 0
  const totalUsers = userStats.reduce((s, u) => s + u._count.id, 0)
  const clientCount = userStats
    .filter(u => ['CLIENT_ADMIN', 'CLIENT_MEMBER'].includes(u.role))
    .reduce((s, u) => s + u._count.id, 0)

  // Revenue (sum of completed projects)
  const completedProjects = await prisma.project.findMany({
    where: { status: 'COMPLETED' },
    select: { agreedBudget: true },
  })
  const totalRevenue = completedProjects.reduce((s, p) => s + (p.agreedBudget || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1300px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>
          Control Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}
        className="max-sm:grid-cols-2"
      >
        {[
          { label: 'Total projects', value: totalProjects, sub: `${activeProjects} active`, icon: FolderKanban, color: 'var(--text)' },
          { label: 'Total users', value: totalUsers, sub: `${clientCount} clients`, icon: Users, color: 'var(--blue)' },
          { label: 'Pending decisions', value: pendingCRs.length, sub: 'Change requests', icon: AlertTriangle, color: pendingCRs.length > 0 ? 'var(--amber)' : 'var(--text)' },
          { label: 'Total delivered', value: formatCurrency(totalRevenue), sub: 'Completed projects', icon: TrendingUp, color: 'var(--green)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{stat.label}</span>
              <stat.icon size={15} color={stat.color} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.6px', color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}
        className="max-lg:grid-cols-1"
      >
        {/* All projects */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Recent projects</h2>
            <Link href="/super-admin/projects" style={{ fontSize: '13px', color: 'var(--accent)' }}>
              View all →
            </Link>
          </div>
          <div>
            {recentProjects.map((project, i) => (
              <Link
                key={project.id}
                href={`/super-admin/projects/${project.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: i < recentProjects.length - 1 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {project.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {project.clientProfile?.user?.name || 'No client'}
                    {project.projectManager && ` · ${project.projectManager.name}`}
                  </p>
                </div>
                <HealthBadge health={project.health} />
                <StatusBadge status={project.status} />
                <div style={{ textAlign: 'right', minWidth: '40px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                    {project.progress}%
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions needed + audit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pending CRs */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              Decisions needed
            </h3>
            {pendingCRs.length === 0 ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 0' }}>
                <CheckCircle2 size={14} color="var(--green)" />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>All clear</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pendingCRs.map(cr => (
                  <Link
                    key={cr.id}
                    href={`/super-admin/change-requests`}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      background: 'var(--amber-bg)',
                      borderRadius: 'var(--radius)',
                      textDecoration: 'none',
                    }}
                  >
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>
                      {cr.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{cr.project.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Audit log */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Activity</h3>
              <Link href="/super-admin/audit" style={{ fontSize: '12px', color: 'var(--accent)' }}>View log →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentAuditLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '100%',
                    background: 'var(--accent)',
                    flexShrink: 0,
                    marginTop: '5px',
                  }} />
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.3 }}>
                      <span style={{ fontWeight: '500' }}>{log.user?.name || 'System'}</span>
                      {' '}{log.action.toLowerCase()} {log.entity.toLowerCase()}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { label: 'Create new project', href: '/super-admin/projects/new' },
                { label: 'Add user', href: '/super-admin/users/new' },
                { label: 'Manage templates', href: '/super-admin/templates' },
                { label: 'View archive', href: '/super-admin/archive' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius)',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                  }}
                >
                  → {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
