// app/(dashboard)/super-admin/handovers/page.tsx
import { requireAdminRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Package, CheckCircle2, Clock, ExternalLink } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PREPARING: { label: 'Preparing',              color: 'var(--blue)'          },
  READY:     { label: 'Ready – Awaiting Client', color: 'var(--accent)'        },
  DELIVERED: { label: 'Delivered',              color: 'var(--green)'         },
}

export default async function SuperAdminHandoversPage() {
  await requireAdminRole()

  const handovers = await prisma.handover.findMany({
    include: {
      project: {
        include: {
          projectManager: { select: { name: true } },
          clientProfile:  { include: { user: { select: { name: true, email: true } } } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const stats = {
    preparing: handovers.filter(h => h.status === 'PREPARING').length,
    ready:     handovers.filter(h => h.status === 'READY').length,
    delivered: handovers.filter(h => h.status === 'DELIVERED').length,
  }

  return (
    <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Package size={20} color="var(--text-secondary)" />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Handovers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            All project handover packages
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}
        className="max-sm:grid-cols-1">
        {[
          { label: 'Preparing',    value: stats.preparing, color: 'var(--blue)'   },
          { label: 'Ready',        value: stats.ready,     color: 'var(--accent)' },
          { label: 'Delivered',    value: stats.delivered, color: 'var(--green)'  },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.6px', color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Handovers list */}
      {handovers.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <Package size={32} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No handovers yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Handover packages are created by PMs when projects are completed.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {handovers.map((h, i) => {
            const statusCfg = STATUS_CONFIG[h.status] || { label: h.status, color: 'var(--text-tertiary)' }
            return (
              <div
                key={h.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: i < handovers.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.project.name}
                    </p>
                    <span style={{
                      fontSize: '11px', fontWeight: '500',
                      color: statusCfg.color,
                      background: `${statusCfg.color}18`,
                      padding: '2px 8px', borderRadius: '100px', flexShrink: 0,
                    }}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {h.project.clientProfile?.user?.name || '—'}
                    </span>
                    {h.project.projectManager && (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        PM: {h.project.projectManager.name}
                      </span>
                    )}
                    {h.liveUrl && (
                      <a href={h.liveUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                        <ExternalLink size={11} /> Live
                      </a>
                    )}
                    {h.generatedAt && (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        Ready {formatDate(h.generatedAt)}
                      </span>
                    )}
                    {h.clientAcknowledgedAt && (
                      <span style={{ fontSize: '12px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={11} /> Acknowledged {formatDate(h.clientAcknowledgedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {h.deploymentPlatform && (
                    <span className="badge badge-gray" style={{ fontSize: '11px' }}>
                      {h.deploymentPlatform}
                    </span>
                  )}
                </div>

                <a
                  href={`/api/projects/${h.projectId}/handover?action=download`}
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  Download ZIP
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
