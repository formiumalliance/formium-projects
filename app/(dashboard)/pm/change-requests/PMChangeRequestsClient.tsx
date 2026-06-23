'use client'
// app/(dashboard)/pm/change-requests/PMChangeRequestsClient.tsx
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { formatDate, formatCurrency } from '@/lib/utils'
import { GitBranch, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  REVISION:   { label: 'Revision',    cls: 'badge-blue'   },
  BUG:        { label: 'Bug Fix',     cls: 'badge-red'    },
  CHARGEABLE: { label: 'Chargeable', cls: 'badge-amber'  },
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  PENDING:     { label: 'Pending Decision', cls: 'badge-amber', icon: Clock        },
  APPROVED:    { label: 'Approved',         cls: 'badge-green', icon: CheckCircle2 },
  REJECTED:    { label: 'Not Approved',     cls: 'badge-red',   icon: XCircle      },
  IN_PROGRESS: { label: 'In Progress',      cls: 'badge-blue',  icon: AlertCircle  },
  DONE:        { label: 'Done',             cls: 'badge-green', icon: CheckCircle2 },
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
]

interface CR {
  id: string
  title: string
  description: string
  type: string
  status: string
  estimatedCost?: number | null
  decisionNotes?: string | null
  createdAt: string | Date
  decidedAt?: string | Date | null
  project: {
    id: string
    name: string
    projectHead?: { name: string } | null
  }
  decidedBy?: { name: string } | null
}

interface Props {
  changeRequests: CR[]
  projects: { id: string; name: string }[]
  filters: { status?: string; projectId?: string }
  canDecide: boolean
}

export default function PMChangeRequestsClient({ changeRequests, projects, filters, canDecide }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [decisionNotes, setDecisionNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [localCRs, setLocalCRs] = useState(changeRequests)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set(key, value) : params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  async function decide(cr: CR, status: 'APPROVED' | 'REJECTED') {
    setProcessing(true)
    const res = await fetch(`/api/projects/${cr.project.id}/change-requests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeRequestId: cr.id, status, decisionNotes }),
    })
    if (res.ok) {
      setLocalCRs(prev => prev.map(c =>
        c.id === cr.id ? { ...c, status, decisionNotes } : c
      ))
      setDecidingId(null)
      setDecisionNotes('')
      toast.success(`Change request ${status.toLowerCase()}`)
    } else {
      toast.error('Failed to process decision')
    }
    setProcessing(false)
  }

  const pending = localCRs.filter(c => c.status === 'PENDING').length

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Change Requests</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {localCRs.length} total
          {pending > 0 && ` · `}
          {pending > 0 && (
            <span style={{ color: 'var(--amber)', fontWeight: '600' }}>
              {pending} awaiting decision
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto', minWidth: '160px' }}
          value={filters.status || ''}
          onChange={e => updateFilter('status', e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: '180px' }}
          value={filters.projectId || ''}
          onChange={e => updateFilter('projectId', e.target.value)}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* List */}
      {localCRs.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <GitBranch size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No change requests</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {localCRs.map(cr => {
            const statusCfg = STATUS_CONFIG[cr.status] || STATUS_CONFIG.PENDING
            const typeCfg   = TYPE_CONFIG[cr.type]   || { label: cr.type, cls: 'badge-gray' }
            const isDeciding = decidingId === cr.id || decidingId === `${cr.id}-reject`

            return (
              <div key={cr.id} className="card">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '7px', flexWrap: 'wrap' }}>
                      <span className={`badge ${typeCfg.cls}`}>{typeCfg.label}</span>
                      <span className={`badge ${statusCfg.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <statusCfg.icon size={10} />
                        {statusCfg.label}
                      </span>
                      {cr.estimatedCost && (
                        <span className="badge badge-amber">Est. {formatCurrency(cr.estimatedCost)}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '5px' }}>
                      {cr.title}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {cr.description}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                  {cr.project.name}
                  {cr.project.projectHead && ` · PH: ${cr.project.projectHead.name}`}
                  {' · '}{formatDate(cr.createdAt as string)}
                  {cr.decidedBy && ` · Decided by ${cr.decidedBy.name}`}
                </p>

                {/* Decision notes */}
                {cr.decisionNotes && (
                  <div style={{
                    padding: '10px 14px', marginBottom: '12px',
                    background: cr.status === 'APPROVED' ? 'var(--green-bg)' : 'var(--red-bg)',
                    borderRadius: 'var(--radius)',
                    borderLeft: `3px solid ${cr.status === 'APPROVED' ? 'var(--green)' : 'var(--red)'}`,
                    fontSize: '13px', color: 'var(--text)',
                  }}>
                    <span style={{ fontWeight: '600', marginRight: '6px' }}>Note:</span>
                    {cr.decisionNotes}
                  </div>
                )}

                {/* PM info panel for pending CRs */}
                {cr.status === 'PENDING' && !canDecide && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--amber-bg)',
                    borderRadius: 'var(--radius)',
                    fontSize: '13px', color: 'var(--text-secondary)',
                  }}>
                    This change request is awaiting a decision from the Project Head
                    {cr.project.projectHead ? ` (${cr.project.projectHead.name})` : ''}.
                  </div>
                )}

                {/* Decision actions — only for admins */}
                {cr.status === 'PENDING' && canDecide && (
                  <div>
                    {!isDeciding ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(22,163,74,0.2)', gap: '5px' }}
                          onClick={() => setDecidingId(cr.id)}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.2)', gap: '5px' }}
                          onClick={() => setDecidingId(`${cr.id}-reject`)}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label className="input-label">
                            {decidingId === `${cr.id}-reject` ? 'Reason for rejection' : 'Notes for client (optional)'}
                          </label>
                          <textarea
                            className="textarea" rows={2} autoFocus
                            placeholder={decidingId === `${cr.id}-reject`
                              ? 'Explain why this is not approved…'
                              : 'Timeline, scope notes, or any message for the client…'}
                            value={decisionNotes}
                            onChange={e => setDecisionNotes(e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {decidingId === cr.id ? (
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--green)', color: '#fff' }}
                              onClick={() => decide(cr, 'APPROVED')}
                              disabled={processing}
                            >
                              {processing ? 'Processing…' : 'Confirm approval'}
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--red)', color: '#fff' }}
                              onClick={() => decide(cr, 'REJECTED')}
                              disabled={processing}
                            >
                              {processing ? 'Processing…' : 'Confirm rejection'}
                            </button>
                          )}
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setDecidingId(null); setDecisionNotes('') }}
                          >
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
