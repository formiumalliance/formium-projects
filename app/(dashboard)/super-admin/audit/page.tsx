export const dynamic = 'force-dynamic'
// app/(dashboard)/super-admin/audit/page.tsx
import { requireAdminRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Shield } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'var(--green)',
  UPDATE: 'var(--blue)',
  DELETE: 'var(--red)',
  ARCHIVE: 'var(--amber)',
  SIGN_IN: 'var(--text-tertiary)',
  SIGN_OUT: 'var(--text-tertiary)',
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string; entity?: string }
}) {
  await requireAdminRole()

  const page = parseInt(searchParams.page || '1')
  const pageSize = 50

  const where: any = {}
  if (searchParams.entity) where.entity = searchParams.entity

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, role: true, email: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  const entities = await prisma.auditLog.groupBy({
    by: ['entity'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  return (
    <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Shield size={20} color="var(--text-secondary)" />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Audit Log</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            {total.toLocaleString()} total events
          </p>
        </div>
      </div>

      {/* Entity filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <a
          href="/super-admin/audit"
          className={`badge ${!searchParams.entity ? 'badge-accent' : 'badge-gray'}`}
          style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
        >
          All
        </a>
        {entities.map(e => (
          <a
            key={e.entity}
            href={`/super-admin/audit?entity=${e.entity}`}
            className={`badge ${searchParams.entity === e.entity ? 'badge-accent' : 'badge-gray'}`}
            style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
          >
            {e.entity} ({e._count.id})
          </a>
        ))}
      </div>

      {/* Log table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 80px 100px 1fr 160px',
          gap: '0',
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          {['Time', 'Action', 'Entity', 'Details', 'User'].map(h => (
            <p key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {h}
            </p>
          ))}
        </div>

        {logs.map((log, i) => (
          <div
            key={log.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 80px 100px 1fr 160px',
              gap: '0',
              padding: '11px 20px',
              borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'start',
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>
                {formatRelativeTime(log.createdAt)}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>

            <span style={{
              fontSize: '11px', fontWeight: '600',
              color: ACTION_COLORS[log.action] || 'var(--text-secondary)',
              background: `${ACTION_COLORS[log.action] || 'var(--text-secondary)'}15`,
              padding: '2px 7px', borderRadius: '100px', width: 'fit-content',
            }}>
              {log.action}
            </span>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
              {log.entity}
            </p>

            <div style={{ minWidth: 0 }}>
              {log.project && (
                <p style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500', marginBottom: '2px' }}>
                  {log.project.name}
                </p>
              )}
              {log.entityId && (
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ID: {log.entityId}
                </p>
              )}
              {log.newValues && typeof log.newValues === 'object' && (
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                  {Object.entries(log.newValues as Record<string, unknown>)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`)
                    .join(' · ')}
                </p>
              )}
            </div>

            <div>
              <p style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>
                {log.user?.name || 'System'}
              </p>
              {log.user?.role && (
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {log.user.role.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {page > 1 && (
            <a href={`/super-admin/audit?page=${page - 1}${searchParams.entity ? `&entity=${searchParams.entity}` : ''}`}
              className="btn btn-secondary btn-sm">← Prev</a>
          )}
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {page < Math.ceil(total / pageSize) && (
            <a href={`/super-admin/audit?page=${page + 1}${searchParams.entity ? `&entity=${searchParams.entity}` : ''}`}
              className="btn btn-secondary btn-sm">Next →</a>
          )}
        </div>
      )}
    </div>
  )
}
