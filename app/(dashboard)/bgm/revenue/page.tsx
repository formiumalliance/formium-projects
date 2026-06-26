export const dynamic = 'force-dynamic'
// app/(dashboard)/bgm/revenue/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, DollarSign, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export default async function BGMRevenuePage() {
  await requireRole([
    UserRole.BUSINESS_GROWTH_MANAGER,
    UserRole.SUPER_ADMIN,
    UserRole.PROJECT_HEAD,
  ])

  const [projects, invoices] = await Promise.all([
    prisma.project.findMany({
      where: { isArchived: false },
      select: {
        id: true, name: true, status: true, type: true,
        agreedBudget: true, proposedBudget: true, advanceAmount: true, currency: true,
        startDate: true, actualEndDate: true,
        clientProfile: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.findMany({
      include: { project: { select: { name: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Financial calculations
  const completed   = projects.filter(p => p.status === 'COMPLETED')
  const active      = projects.filter(p => p.status === 'ACTIVE')
  const pipeline    = projects.filter(p => ['DRAFT', 'PROPOSAL', 'AWAITING_PAYMENT'].includes(p.status))

  const totalRevenue      = completed.reduce((s, p) => s + (p.agreedBudget || 0), 0)
  const activeValue       = active.reduce((s, p)    => s + (p.agreedBudget || 0), 0)
  const pipelineValue     = pipeline.reduce((s, p)  => s + (p.proposedBudget || 0), 0)
  const totalInvoiced     = invoices.reduce((s, i)  => s + i.totalAmount, 0)
  const totalCollected    = invoices.filter(i => i.isPaid).reduce((s, i) => s + i.totalAmount, 0)
  const totalOutstanding  = invoices.filter(i => !i.isPaid).reduce((s, i) => s + i.totalAmount, 0)

  // By project type
  const byType: Record<string, { count: number; value: number }> = {}
  projects.forEach(p => {
    if (!byType[p.type]) byType[p.type] = { count: 0, value: 0 }
    byType[p.type].count++
    byType[p.type].value += (p.agreedBudget || p.proposedBudget || 0)
  })

  const TYPE_LABELS: Record<string, string> = {
    BUSINESS_WEBSITE:  'Business Website',
    ECOMMERCE_WEBSITE: 'E-commerce',
    PORTFOLIO_WEBSITE: 'Portfolio',
    CATALOGUE_WEBSITE: 'Catalogue',
    MOBILE_APP:        'Mobile App',
    SAAS:              'SaaS',
    CRM:               'CRM',
    ERP:               'ERP',
    CUSTOM_PRODUCT:    'Custom',
  }

  const sortedTypes = Object.entries(byType).sort((a, b) => b[1].value - a[1].value)
  const maxTypeValue = sortedTypes[0]?.[1].value || 1

  return (
    <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <TrendingUp size={20} color="var(--text-secondary)" />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Revenue</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            Financial overview across all projects
          </p>
        </div>
      </div>

      {/* Top-line metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}
        className="max-sm:grid-cols-1">
        {[
          { label: 'Total delivered revenue', value: formatCurrency(totalRevenue), sub: `${completed.length} projects`, color: 'var(--green)', icon: CheckCircle2 },
          { label: 'Active project value',    value: formatCurrency(activeValue),  sub: `${active.length} projects`,    color: 'var(--blue)',  icon: Clock        },
          { label: 'Pipeline value',          value: formatCurrency(pipelineValue),sub: `${pipeline.length} leads`,     color: 'var(--text-secondary)', icon: TrendingUp },
        ].map(m => (
          <div key={m.label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500',
                textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.3 }}>{m.label}</p>
              <m.icon size={15} color={m.color} />
            </div>
            <p style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px', color: m.color, lineHeight: 1 }}>
              {m.value}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>{m.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
        className="max-lg:grid-cols-1">

        {/* Collections */}
        <div className="card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '18px' }}>Collections</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Total invoiced',    value: formatCurrency(totalInvoiced),    color: 'var(--text)'          },
              { label: 'Collected',         value: formatCurrency(totalCollected),   color: 'var(--green)'         },
              { label: 'Outstanding',       value: formatCurrency(totalOutstanding), color: totalOutstanding > 0 ? 'var(--amber)' : 'var(--text-tertiary)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: item.color, letterSpacing: '-0.2px' }}>
                  {item.value}
                </span>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {invoices.filter(i => !i.isPaid).slice(0, 4).map(inv => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{inv.invoiceNumber}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{inv.project.name}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--amber)' }}>
                      {formatCurrency(inv.totalAmount)}
                    </p>
                    {inv.dueDate && (
                      <p style={{ fontSize: '10px', color: new Date(inv.dueDate) < new Date() ? 'var(--red)' : 'var(--text-tertiary)' }}>
                        Due {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue by type */}
        <div className="card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '18px' }}>Revenue by project type</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedTypes.map(([type, data]) => (
              <div key={type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                    {TYPE_LABELS[type] || type}
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '6px' }}>
                      ×{data.count}
                    </span>
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                    {formatCurrency(data.value)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(data.value / maxTypeValue) * 100}%` }} />
                </div>
              </div>
            ))}
            {sortedTypes.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
                No revenue data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent projects financial summary */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600' }}>Project financials</h2>
        </div>
        {projects.slice(0, 12).map((p, i) => (
          <div key={p.id} style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '16px',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: i < Math.min(projects.length, 12) - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {p.clientProfile?.user?.name || '—'} · {TYPE_LABELS[p.type] || p.type}
              </p>
            </div>
            <span className={`badge ${
              p.status === 'COMPLETED' ? 'badge-green'
              : p.status === 'ACTIVE'  ? 'badge-blue'
              : 'badge-gray'
            }`} style={{ fontSize: '11px' }}>
              {p.status.replace('_', ' ')}
            </span>
            <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', textAlign: 'right', minWidth: '80px' }}>
              {p.agreedBudget
                ? formatCurrency(p.agreedBudget)
                : p.proposedBudget
                  ? <span style={{ color: 'var(--text-tertiary)' }}>{formatCurrency(p.proposedBudget)}</span>
                  : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
              }
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
