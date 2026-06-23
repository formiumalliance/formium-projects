'use client'
// app/(dashboard)/pm/projects/[id]/requirements/page.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle, Plus, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Requirement {
  id: string
  title: string
  description?: string | null
  isRequired: boolean
  isReceived: boolean
  receivedAt?: string | null
  dueDate?: string | null
  notes?: string | null
  sortOrder: number
}

export default function RequirementsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newReq, setNewReq] = useState({ title: '', description: '', isRequired: true, dueDate: '' })

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/requirements`),
      fetch(`/api/projects/${projectId}`),
    ]).then(async ([reqRes, projRes]) => {
      const reqData = await reqRes.json()
      const projData = await projRes.json()
      setRequirements(reqData.data || [])
      setProjectName(projData.data?.name || '')
      setLoading(false)
    })
  }, [projectId])

  async function markReceived(id: string, isReceived: boolean) {
    const res = await fetch(`/api/projects/${projectId}/requirements`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirementId: id, isReceived }),
    })
    if (res.ok) {
      setRequirements(prev => prev.map(r =>
        r.id === id ? { ...r, isReceived, receivedAt: isReceived ? new Date().toISOString() : null } : r
      ))
      toast.success(isReceived ? 'Marked as received' : 'Marked as pending')
    }
  }

  async function addRequirement() {
    if (!newReq.title) { toast.error('Title is required'); return }
    setAdding(true)
    const res = await fetch(`/api/projects/${projectId}/requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newReq.title,
        description: newReq.description || undefined,
        isRequired: newReq.isRequired,
        dueDate: newReq.dueDate || undefined,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setRequirements(prev => [...prev, data.data])
      setNewReq({ title: '', description: '', isRequired: true, dueDate: '' })
      setShowAdd(false)
      toast.success('Requirement added')
    }
    setAdding(false)
  }

  const received = requirements.filter(r => r.isReceived).length
  const total = requirements.length
  const pendingRequired = requirements.filter(r => r.isRequired && !r.isReceived).length

  return (
    <div style={{ maxWidth: '750px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <Link
          href={`/pm/projects/${projectId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px', textDecoration: 'none' }}
        >
          <ArrowLeft size={13} /> Back to project
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Requirements</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {projectName} · {received}/{total} received
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(!showAdd)} style={{ gap: '6px' }}>
            <Plus size={14} />
            Add requirement
          </button>
        </div>
      </div>

      {/* Alert if pending required */}
      {pendingRequired > 0 && (
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'center',
          padding: '12px 16px',
          background: 'var(--amber-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(217,119,6,0.15)',
        }}>
          <Clock size={15} color="var(--amber)" />
          <p style={{ fontSize: '13px', color: 'var(--text)' }}>
            <strong>{pendingRequired} required item{pendingRequired > 1 ? 's' : ''}</strong> not yet received.
            {' '}Timeline will pause if they remain overdue past the grace period.
          </p>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600' }}>New requirement</h3>
          <div>
            <label className="input-label">Title *</label>
            <input className="input" placeholder="e.g. Brand logo (SVG or PNG)" value={newReq.title} onChange={e => setNewReq(p => ({ ...p, title: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="input-label">Description (optional)</label>
            <textarea className="textarea" rows={2} placeholder="Accepted formats, size requirements…" value={newReq.description} onChange={e => setNewReq(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">Due date</label>
              <input className="input" type="date" value={newReq.dueDate} onChange={e => setNewReq(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
              <input
                type="checkbox"
                id="isRequired"
                checked={newReq.isRequired}
                onChange={e => setNewReq(p => ({ ...p, isRequired: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="isRequired" style={{ fontSize: '14px', color: 'var(--text)', cursor: 'pointer' }}>
                Required (blocks timeline if missing)
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={addRequirement} disabled={adding}>
              {adding ? 'Adding…' : 'Add requirement'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Requirements list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : requirements.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={28} color="var(--text-tertiary)" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No requirements added yet</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {requirements.map((req, i) => {
            const isOverdue = req.dueDate && new Date(req.dueDate) < new Date() && !req.isReceived
            return (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  padding: '14px 20px',
                  borderBottom: i < requirements.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isOverdue ? 'var(--amber-bg)' : 'transparent',
                }}
              >
                <button
                  onClick={() => markReceived(req.id, !req.isReceived)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0, marginTop: '1px' }}
                  title={req.isReceived ? 'Mark as not received' : 'Mark as received'}
                >
                  {req.isReceived
                    ? <CheckCircle2 size={18} color="var(--green)" />
                    : <Circle size={18} color={isOverdue ? 'var(--amber)' : 'var(--border-strong)'} />
                  }
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: req.isReceived ? 'var(--text-tertiary)' : 'var(--text)',
                      textDecoration: req.isReceived ? 'line-through' : 'none',
                    }}>
                      {req.title}
                    </p>
                    {req.isRequired && (
                      <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--red)', background: 'var(--red-bg)', padding: '1px 6px', borderRadius: '100px' }}>
                        Required
                      </span>
                    )}
                  </div>
                  {req.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4, marginBottom: '3px' }}>
                      {req.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {req.dueDate && !req.isReceived && (
                      <p style={{ fontSize: '11px', color: isOverdue ? 'var(--amber)' : 'var(--text-tertiary)' }}>
                        {isOverdue ? '⚠ Overdue · ' : 'Due '}
                        {formatDate(req.dueDate)}
                      </p>
                    )}
                    {req.isReceived && req.receivedAt && (
                      <p style={{ fontSize: '11px', color: 'var(--green)' }}>
                        ✓ Received {formatDate(req.receivedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
