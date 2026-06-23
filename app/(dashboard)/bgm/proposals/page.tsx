'use client'
// app/(dashboard)/bgm/proposals/page.tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { formatDate, formatCurrency } from '@/lib/utils'
import { FileText, PlusCircle, CheckCircle2, Clock } from 'lucide-react'

interface Proposal {
  id: string
  title: string
  amount: number
  isAccepted: boolean
  acceptedAt?: string | null
  validUntil?: string | null
  notes?: string | null
  createdAt: string
  projectId: string
  projectName?: string
}

interface Project {
  id: string
  name: string
  currency: string
}

export default function BGMProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading,  setLoading]    = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving,   setSaving]     = useState(false)
  const [form,     setForm]       = useState({
    projectId: '', title: '', amount: '', validUntil: '', notes: '',
  })

  useEffect(() => {
    fetch('/api/projects?pageSize=100')
      .then(r => r.json())
      .then(async data => {
        const projs: Project[] = data.data || []
        setProjects(projs)

        const all: Proposal[] = []
        await Promise.all(
          projs.map(async p => {
            const res  = await fetch(`/api/projects/${p.id}/proposals`)
            const resp = await res.json()
            ;(resp.data || []).forEach((pr: Proposal) => {
              all.push({ ...pr, projectName: p.name })
            })
          })
        )
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setProposals(all)
        setLoading(false)
      })
  }, [])

  async function createProposal() {
    if (!form.projectId || !form.title || !form.amount) {
      toast.error('Project, title and amount are required')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/projects/${form.projectId}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:      form.title,
        amount:     Number(form.amount),
        validUntil: form.validUntil || undefined,
        notes:      form.notes || undefined,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      const proj = projects.find(p => p.id === form.projectId)
      setProposals(prev => [{ ...data.data, projectName: proj?.name || '' }, ...prev])
      setForm({ projectId: '', title: '', amount: '', validUntil: '', notes: '' })
      setShowForm(false)
      toast.success('Proposal created')
    } else {
      toast.error(data.error || 'Failed to create proposal')
    }
    setSaving(false)
  }

  async function acceptProposal(proposal: Proposal) {
    const res = await fetch(`/api/projects/${proposal.projectId}/proposals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: proposal.id, isAccepted: true }),
    })
    if (res.ok) {
      setProposals(prev => prev.map(p =>
        p.id === proposal.id ? { ...p, isAccepted: true, acceptedAt: new Date().toISOString() } : p
      ))
      toast.success('Proposal accepted — project moved to Awaiting Payment')
    }
  }

  const accepted = proposals.filter(p => p.isAccepted).length
  const pending  = proposals.filter(p => !p.isAccepted).length

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Proposals</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {pending} pending · {accepted} accepted
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ gap: '6px' }}>
          <PlusCircle size={15} /> New proposal
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600' }}>New proposal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
            className="max-sm:grid-cols-1">
            <div>
              <label className="input-label">Project *</label>
              <select className="input" value={form.projectId}
                onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}>
                <option value="">— Select project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Amount (₹) *</label>
              <input className="input" type="number" placeholder="75000" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="input-label">Proposal title *</label>
            <input className="input" placeholder="Website Development Proposal — v1"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
            className="max-sm:grid-cols-1">
            <div>
              <label className="input-label">Valid until</label>
              <input className="input" type="date" value={form.validUntil}
                onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">Notes</label>
              <input className="input" placeholder="Includes 1 revision round…" value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={createProposal} disabled={saving}>
              {saving ? 'Creating…' : 'Create proposal'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Proposals list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      ) : proposals.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <FileText size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No proposals yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Create your first proposal above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {proposals.map(proposal => (
            <div key={proposal.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px' }}>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
                      {proposal.title}
                    </p>
                    {proposal.isAccepted
                      ? <span className="badge badge-green" style={{ fontSize: '11px', gap: '3px', display: 'inline-flex' }}>
                          <CheckCircle2 size={10} /> Accepted
                        </span>
                      : <span className="badge badge-amber" style={{ fontSize: '11px', gap: '3px', display: 'inline-flex' }}>
                          <Clock size={10} /> Pending
                        </span>
                    }
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {proposal.projectName}
                    {proposal.validUntil && ` · Valid until ${formatDate(proposal.validUntil)}`}
                    {proposal.acceptedAt && ` · Accepted ${formatDate(proposal.acceptedAt)}`}
                    {` · Created ${formatDate(proposal.createdAt)}`}
                  </p>
                  {proposal.notes && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      {proposal.notes}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.3px' }}>
                    {formatCurrency(proposal.amount)}
                  </p>
                  {!proposal.isAccepted && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '8px', gap: '5px' }}
                      onClick={() => acceptProposal(proposal)}
                    >
                      <CheckCircle2 size={13} /> Mark accepted
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
