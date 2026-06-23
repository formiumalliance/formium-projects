'use client'
// app/(dashboard)/client/change-requests/page.tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { formatDate, formatCurrency } from '@/lib/utils'
import { GitBranch, PlusCircle, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

const CR_TYPE_INFO: Record<string, { label: string; description: string; cls: string }> = {
  REVISION: {
    label: 'Revision',
    description: 'A change within the original agreed scope',
    cls: 'badge-blue',
  },
  BUG: {
    label: 'Bug Fix',
    description: 'Something is not working as intended',
    cls: 'badge-red',
  },
  CHARGEABLE: {
    label: 'New Feature',
    description: 'An addition outside the original scope (may have extra cost)',
    cls: 'badge-amber',
  },
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending Review', cls: 'badge-amber', icon: Clock },
  APPROVED: { label: 'Approved', cls: 'badge-green', icon: CheckCircle2 },
  REJECTED: { label: 'Not Approved', cls: 'badge-red', icon: XCircle },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-blue', icon: AlertTriangle },
  DONE: { label: 'Done', cls: 'badge-green', icon: CheckCircle2 },
}

interface ChangeRequest {
  id: string
  title: string
  description: string
  type: string
  status: string
  estimatedCost?: number
  decisionNotes?: string
  decidedAt?: string
  createdAt: string
  project: { name: string }
}

export default function ClientChangeRequestsPage() {
  const [crs, setCRs] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [projectId, setProjectId] = useState<string>('')
  const [form, setForm] = useState({ title: '', description: '', type: 'REVISION' })

  useEffect(() => {
    // First get the client's project ID
    fetch('/api/projects?pageSize=1')
      .then(r => r.json())
      .then(async data => {
        const project = data.data?.[0]
        if (project) {
          setProjectId(project.id)
          const crRes = await fetch(`/api/projects/${project.id}/change-requests`)
          const crData = await crRes.json()
          setCRs(crData.data?.map((cr: any) => ({ ...cr, project: { name: project.name } })) || [])
        }
        setLoading(false)
      })
  }, [])

  async function submitCR() {
    if (!form.title || !form.description) {
      toast.error('Title and description are required')
      return
    }
    if (!projectId) return
    setSubmitting(true)

    const res = await fetch(`/api/projects/${projectId}/change-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (res.ok) {
      setCRs(prev => [{ ...data.data, project: { name: '' } }, ...prev])
      setForm({ title: '', description: '', type: 'REVISION' })
      setShowModal(false)
      toast.success('Change request submitted. The project team will review and respond.')
    } else {
      toast.error(data.error || 'Failed to submit')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Change Requests</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Request changes, revisions, or report issues with your project.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <PlusCircle size={15} />
          Request change
        </button>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}
        className="max-sm:grid-cols-1"
      >
        {Object.entries(CR_TYPE_INFO).map(([type, info]) => (
          <div key={type} className="card card-sm" style={{ padding: '14px 16px' }}>
            <span className={`badge ${info.cls}`} style={{ marginBottom: '8px', display: 'inline-flex' }}>
              {info.label}
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {info.description}
            </p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ height: '100px' }}>
              <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-xl)' }} />
            </div>
          ))}
        </div>
      ) : crs.length === 0 ? (
        <div className="empty-state">
          <GitBranch size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No change requests</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Submit a request if you'd like to revise something or report an issue.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {crs.map(cr => {
            const status = STATUS_CONFIG[cr.status] || STATUS_CONFIG.PENDING
            const type = CR_TYPE_INFO[cr.type]

            return (
              <div key={cr.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
                      {cr.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {cr.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span className={`badge ${status.cls}`}>
                      <status.icon size={10} />
                      {status.label}
                    </span>
                    {type && <span className={`badge ${type.cls}`}>{type.label}</span>}
                  </div>
                </div>

                {cr.estimatedCost && cr.type === 'CHARGEABLE' && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'var(--amber-bg)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '10px',
                    fontSize: '13px',
                    color: 'var(--text)',
                  }}>
                    Estimated additional cost: <strong>{formatCurrency(cr.estimatedCost)}</strong>
                  </div>
                )}

                {cr.decisionNotes && (
                  <div style={{
                    padding: '10px 12px',
                    background: cr.status === 'APPROVED' ? 'var(--green-bg)' : 'var(--red-bg)',
                    borderRadius: 'var(--radius)',
                    marginBottom: '10px',
                    borderLeft: `3px solid ${cr.status === 'APPROVED' ? 'var(--green)' : 'var(--red)'}`,
                  }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: cr.status === 'APPROVED' ? 'var(--green)' : 'var(--red)', marginBottom: '3px' }}>
                      Team's response:
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text)' }}>{cr.decisionNotes}</p>
                  </div>
                )}

                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Submitted {formatDate(cr.createdAt)}
                  {cr.decidedAt && ` · Reviewed ${formatDate(cr.decidedAt)}`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px', animation: 'animateIn 0.2s ease-out' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
              Submit a change request
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">What type of change is this?</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(CR_TYPE_INFO).map(([value, info]) => (
                    <option key={value} value={value}>{info.label} — {info.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Title</label>
                <input
                  className="input"
                  placeholder="Brief summary of the change"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="Describe exactly what you'd like changed and why. Be as specific as possible — include page names, section names, screenshots if possible."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitCR} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
