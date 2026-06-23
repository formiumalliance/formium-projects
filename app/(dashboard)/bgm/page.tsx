// app/(dashboard)/bgm/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { HealthBadge, StatusBadge } from '@/components/projects/HealthBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PlusCircle, TrendingUp, FolderKanban, DollarSign } from 'lucide-react'

export default async function BGMDashboardPage() {
  const session = await requireRole([
    UserRole.BUSINESS_GROWTH_MANAGER,
    UserRole.SUPER_ADMIN,
    UserRole.PROJECT_HEAD,
  ])

  const projects = await prisma.project.findMany({
    where: { isArchived: false },
    include: {
      clientProfile: { include: { user: { select: { name: true, email: true } } } },
      projectManager: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const proposals = await prisma.proposal.findMany({
    include: { project: { select: { name: true, status: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Revenue metrics
  const activeRevenue = projects
    .filter(p => p.status === 'ACTIVE')
    .reduce((s, p) => s + (p.agreedBudget || 0), 0)

  const completedRevenue = projects
    .filter(p => p.status === 'COMPLETED')
    .reduce((s, p) => s + (p.agreedBudget || 0), 0)

  const pendingPayments = projects
    .filter(p => p.status === 'AWAITING_PAYMENT')
    .reduce((s, p) => s + (p.proposedBudget || 0), 0)

  const pipelineValue = projects
    .filter(p => ['DRAFT', 'PROPOSAL'].includes(p.status))
    .reduce((s, p) => s + (p.proposedBudget || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>
            Business Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Pipeline, projects and revenue at a glance
          </p>
        </div>
        <Link href="/bgm/projects/new" className="btn btn-primary">
          <PlusCircle size={15} />
          New Project
        </Link>
      </div>

      {/* Revenue stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}
        className="max-sm:grid-cols-2"
      >
        {[
          { label: 'Active value', value: formatCurrency(activeRevenue), sub: `${projects.filter(p => p.status === 'ACTIVE').length} projects`, color: 'var(--blue)' },
          { label: 'Completed revenue', value: formatCurrency(completedRevenue), sub: `${projects.filter(p => p.status === 'COMPLETED').length} delivered`, color: 'var(--green)' },
          { label: 'Pending payments', value: formatCurrency(pendingPayments), sub: 'Awaiting advance', color: 'var(--amber)' },
          { label: 'Pipeline', value: formatCurrency(pipelineValue), sub: 'Proposals & drafts', color: 'var(--text-secondary)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: stat.color, letterSpacing: '-0.4px', lineHeight: 1 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Project pipeline */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Project Pipeline</h2>
          <Link href="/bgm/projects" style={{ fontSize: '13px', color: 'var(--accent)' }}>
            View all →
          </Link>
        </div>
        <div>
          {projects.slice(0, 10).map((project, i) => (
            <div
              key={project.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: '12px',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: i < Math.min(projects.length, 10) - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: '14px', fontWeight: '500', color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginBottom: '3px',
                }}>
                  {project.name}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {project.clientProfile?.user?.name || 'No client'}
                  {project.agreedBudget && ` · ${formatCurrency(project.agreedBudget)}`}
                </p>
              </div>
              <StatusBadge status={project.status} />
              <HealthBadge health={project.health} />
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', textAlign: 'right', minWidth: '40px' }}>
                {project.progress}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent proposals */}
      {proposals.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Recent Proposals</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {proposals.map(proposal => (
              <div
                key={proposal.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius)',
                  gap: '12px',
                }}
              >
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>
                    {proposal.title}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {proposal.project.name} · {formatDate(proposal.createdAt)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
                    {formatCurrency(proposal.amount)}
                  </p>
                  <span className={`badge ${proposal.isAccepted ? 'badge-green' : 'badge-amber'}`}
                    style={{ fontSize: '10px' }}>
                    {proposal.isAccepted ? 'Accepted' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
