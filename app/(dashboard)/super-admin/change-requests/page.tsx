'use client'
// app/(dashboard)/super-admin/change-requests/page.tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { formatDate, formatCurrency } from '@/lib/utils'
import { GitBranch, CheckCircle2, XCircle, Clock } from 'lucide-react'

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  REVISION: { label: 'Revision', cls: 'badge-blue' },
  BUG: { label: 'Bug Fix', cls: 'badge-red' },
  CHARGEABLE: { label: 'Chargeable', cls: 'badge-amber' },
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'badge-amber' },
  APPROVED: { label: 'Approved', cls: 'badge-green' },
  REJECTED: { label: 'Rejected', cls: 'badge-red' },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-blue' },
  DONE: { label: 'Done', cls: 'badge-green' },
}

interface CR {
  id: string
  title: string
  description: string
  type: string
  status: string
  estimatedCost?: number | null
  decisionNotes?: string | null
  createdAt: string
  decidedAt?: string | null
  project: { id: string; name: string }
}

export default function SuperAdminChangeRequestsPage() {
  const [crs, setCRs] = useState<CR[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [deciding, setDeciding] = useState<string | null>(null)
  const [decisionForm, setDecisionForm] = useState<{ notes: string }>({ notes: '' })

  useEffect(() => {
    // Load all change requests across all projects
    fetch('/api/admin/change-requests')
      .then(r => r.json())
      .then(data => { setCRs(data.data || []); setLoading(false) })
  }, [])

  async function decide(crId: string, projectId: string, status: 'APPROVED' | 'REJECTED') {
    const res = await fetch(`/api/projects/${projectId}/change-requests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeRequestId: crId, status, decisionNotes: decisionForm.notes }),
    })
    if (res.ok) {
      setCRs(prev => prev.map(cr => cr.id === crId ? { ...cr, status, decisionNotes: decisionForm.notes } : cr))
      setDeciding(null)
      setDecisionForm({ notes: '' })
      toast.success(`Change request ${status.toLowerCase()}`)
    } else {
      toast.error('Failed to update change request')
    }
  }

  const filtered = crs.filter(cr => filter === 'ALL' || cr.status === filter)
  const counts = {
    PENDING: crs.filter(cr => cr.status === 'PENDING').length,
    APPROVED: crs.filter(cr => cr.status === 'APPROVED').length,
    REJECTED: crs.filter(cr => cr.status === 'REJECTED').length,
  }

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Change Requests</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Review and decide on client change requests.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'PENDING', label: 'Needs Decision', count: counts.PENDING },
          { key: 'APPROVED', label: 'Approved', count: counts.APPROVED },
          { key: 'REJECTED', label: 'Rejected', count: counts.REJECTED },
          { key: 'ALL', label: 'All', count: crs.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 14px', fontSize: '13px',
              fontWeight: filter === tab.key ? '600' : '400',
              color: filter === tab.key ? 'var(--text)' : 'var(--text-secondary)',
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${filter === tab.key ? 'var(--accent)' : 'transparent'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              marginBottom: '-1px', transition: 'all 0.15s',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                fontSize: '11px', fontWeight: '600',
                background: filter === tab.key ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
                color: filter === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: '100px', padding: '1px 6px',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <GitBranch size={28} color="var(--text-tertiary)" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            No {filter.toLowerCase()} change requests
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(cr => {
            const isDeciding = deciding === cr.id
            const typeConfig = TYPE_CONFIG[cr.type] || { label: cr.type, cls: 'badge-gray' }
            const statusConfig = STATUS_CONFIG[cr.status] || { label: cr.status, cls: 'badge-gray' }

            return (
              <div key={cr.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span className={`badge ${typeConfig.cls}`}>{typeConfig.label}</span>
                      <span className={`badge ${statusConfig.cls}`}>{statusConfig.label}</span>
                      {cr.estimatedCost && (
                        <span className="badge badge-amber">
                          Est. {formatCurrency(cr.estimatedCost)}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '5px' }}>
                      {cr.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {cr.description}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                  {cr.project.name} · Submitted {formatDate(cr.createdAt)}
                  {cr.decidedAt && ` · Decided ${formatDate(cr.decidedAt)}`}
                </p>

                {cr.decisionNotes && (
                  <div style={{
                    padding: '10px 12px',
                    background: cr.status === 'APPROVED' ? 'var(--green-bg)' : 'var(--red-bg)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '12px',
                    fontSize: '13px', color: 'var(--text)',
                  }}>
                    <span style={{ fontWeight: '600', marginRight: '6px' }}>Note:</span>
                    {cr.decisionNotes}
                  </div>
                )}

                {/* Decision panel */}
                {cr.status === 'PENDING' && (
                  <div>
                    {!isDeciding ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(22,163,74,0.2)', gap: '5px' }}
                          onClick={() => setDeciding(cr.id)}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.2)', gap: '5px' }}
                          onClick={() => setDeciding(`${cr.id}-reject`)}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label className="input-label">
                            {deciding === `${cr.id}-reject` ? 'Reason for rejection' : 'Notes for client (optional)'}
                          </label>
                          <textarea
                            className="textarea"
                            rows={2}
                            placeholder={deciding === `${cr.id}-reject`
                              ? 'Explain why this change request is not approved…'
                              : 'Any notes about this approval (timeline, cost, etc.)…'}
                            value={decisionForm.notes}
                            onChange={e => setDecisionForm({ notes: e.target.value })}
                            autoFocus
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {deciding === cr.id ? (
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--green)', color: '#fff', gap: '5px' }}
                              onClick={() => decide(cr.id, cr.project.id, 'APPROVED')}
                            >
                              <CheckCircle2 size={13} /> Confirm approval
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--red)', color: '#fff', gap: '5px' }}
                              onClick={() => decide(cr.id, cr.project.id, 'REJECTED')}
                            >
                              <XCircle size={13} /> Confirm rejection
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => { setDeciding(null); setDecisionForm({ notes: '' }) }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
