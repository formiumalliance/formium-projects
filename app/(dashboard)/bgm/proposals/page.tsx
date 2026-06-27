'use client'
// app/(dashboard)/bgm/proposals/page.tsx
// FR-001: Proposals no longer require an existing project
// FR-003: Lead source tracking
// FR-004: Convert accepted proposal to project
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { formatDate, formatCurrency } from '@/lib/utils'
import { FileText, PlusCircle, CheckCircle2, Clock, X, ArrowRight, Users } from 'lucide-react'

const LEAD_SOURCE_LABELS: Record<string, string> = {
  CONTACT_SPHERE: 'Contact Sphere',
  DIRECT_LEAD:    'Direct Lead',
  WEBSITE:        'Website',
  REFERRAL:       'Referral',
  SOCIAL_MEDIA:   'Social Media',
  COLD_OUTREACH:  'Cold Outreach',
  EXISTING_CLIENT:'Existing Client',
  OTHER:          'Other',
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: 'Draft',    cls: 'badge-gray'  },
  SENT:     { label: 'Sent',     cls: 'badge-blue'  },
  ACCEPTED: { label: 'Accepted', cls: 'badge-green' },
  REJECTED: { label: 'Rejected', cls: 'badge-red'   },
  EXPIRED:  { label: 'Expired',  cls: 'badge-gray'  },
}

interface Proposal {
  id: string; title: string; amount: number; currency: string
  isAccepted: boolean; acceptedAt?: string | null; validUntil?: string | null
  notes?: string | null; createdAt: string; status: string
  projectId?: string | null
  clientName?: string | null; clientEmail?: string | null; clientPhone?: string | null
  companyName?: string | null; leadSource?: string | null
  project?: { id: string; name: string } | null
  contactSphere?: { id: string; contactName: string } | null
}

interface ContactSphere { id: string; contactName: string; companyName?: string | null }
interface Project { id: string; name: string }

const EMPTY_FORM = {
  title: '', amount: '', currency: 'INR', validUntil: '', notes: '',
  clientName: '', clientEmail: '', clientPhone: '', companyName: '',
  leadSource: '', contactSphereId: '', projectId: '',
}

export default function BGMProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [contacts,  setContacts]  = useState<ContactSphere[]>([])
  const [projects,  setProjects]  = useState<Project[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [filter,    setFilter]    = useState('ALL')
  const [form,      setForm]      = useState({ ...EMPTY_FORM })

  useEffect(() => {
    Promise.all([
      fetch('/api/proposals').then(r => r.json()),
      fetch('/api/contact-sphere').then(r => r.json()),
      fetch('/api/projects?pageSize=100').then(r => r.json()),
    ]).then(([pData, cData, prData]) => {
      setProposals(pData.data || [])
      setContacts(cData.data || [])
      setProjects(prData.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function createProposal() {
    if (!form.title || !form.amount) {
      toast.error('Title and amount are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:           form.title,
          amount:          Number(form.amount),
          currency:        form.currency,
          validUntil:      form.validUntil || undefined,
          notes:           form.notes || undefined,
          clientName:      form.clientName || undefined,
          clientEmail:     form.clientEmail || undefined,
          clientPhone:     form.clientPhone || undefined,
          companyName:     form.companyName || undefined,
          leadSource:      form.leadSource || undefined,
          contactSphereId: form.contactSphereId || undefined,
          projectId:       form.projectId || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setProposals(prev => [data.data, ...prev])
        setForm({ ...EMPTY_FORM })
        setShowForm(false)
        toast.success('Proposal created')
      } else {
        toast.error(data.error || 'Failed')
      }
    } finally { setSaving(false) }
  }

  async function convertToProject(proposal: Proposal) {
    if (!confirm('Create a new project from this proposal?')) return
    const res = await fetch(`/api/proposals/${proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'convert_to_project' }),
    })
    const data = await res.json()
    if (res.ok) {
      setProposals(prev => prev.map(p =>
        p.id === proposal.id ? { ...p, isAccepted: true, status: 'ACCEPTED', projectId: data.data.project.id, project: data.data.project } : p
      ))
      toast.success('Project created! Go to Projects to configure it.')
    } else {
      toast.error(data.error || 'Failed')
    }
  }

  async function updateStatus(proposal: Proposal, status: string) {
    const res = await fetch(`/api/proposals/${proposal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(status === 'ACCEPTED' ? { isAccepted: true } : {}) }),
    })
    if (res.ok) {
      setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status } : p))
      toast.success('Status updated')
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const filtered = filter === 'ALL' ? proposals : proposals.filter(p => p.status === filter)
  const counts = {
    total: proposals.length,
    accepted: proposals.filter(p => p.status === 'ACCEPTED').length,
    pending: proposals.filter(p => p.status === 'DRAFT' || p.status === 'SENT').length,
  }
  const totalValue = proposals.filter(p => p.status === 'ACCEPTED').reduce((s, p) => s + p.amount, 0)

  return (
    <div style={{ maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Proposals</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {counts.pending} pending · {counts.accepted} accepted · {formatCurrency(totalValue)} won
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={15} /> New proposal
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600' }}>New proposal</h2>
            <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Basic info */}
          <div>
            <label className="input-label">Proposal title *</label>
            <input className="input" placeholder="Website Development Proposal — v1" value={form.title} onChange={set('title')} autoFocus />
          </div>

          <div className="form-grid-2">
            <div>
              <label className="input-label">Amount *</label>
              <input className="input" type="number" placeholder="75000" value={form.amount} onChange={set('amount')} />
            </div>
            <div>
              <label className="input-label">Valid until</label>
              <input className="input" type="date" value={form.validUntil} onChange={set('validUntil')} />
            </div>
          </div>

          {/* Client details — FR-001: stored directly, no project needed */}
          <div style={{ paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Client info (no project required)
            </p>
            <div className="form-grid-2">
              <div>
                <label className="input-label">Contact name</label>
                <input className="input" placeholder="Rahul Sharma" value={form.clientName} onChange={set('clientName')} />
              </div>
              <div>
                <label className="input-label">Company</label>
                <input className="input" placeholder="Acme Corp" value={form.companyName} onChange={set('companyName')} />
              </div>
            </div>
            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <div>
                <label className="input-label">Email</label>
                <input className="input" type="email" placeholder="rahul@acme.com" value={form.clientEmail} onChange={set('clientEmail')} />
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input className="input" placeholder="+91 98765 43210" value={form.clientPhone} onChange={set('clientPhone')} />
              </div>
            </div>
          </div>

          {/* Lead source — FR-003 */}
          <div style={{ paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Lead source (FR-003)
            </p>
            <div className="form-grid-2">
              <div>
                <label className="input-label">Lead source</label>
                <select className="input" value={form.leadSource} onChange={set('leadSource')}>
                  <option value="">— Select source —</option>
                  {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {form.leadSource === 'CONTACT_SPHERE' && (
                <div>
                  <label className="input-label">Contact Sphere person</label>
                  <select className="input" value={form.contactSphereId} onChange={set('contactSphereId')}>
                    <option value="">— Select contact —</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.contactName}{c.companyName ? ` (${c.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Optional link to existing project */}
          <div style={{ paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
            <label className="input-label">Link to existing project (optional)</label>
            <select className="input" value={form.projectId} onChange={set('projectId')}>
              <option value="">— None —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="input-label">Notes</label>
            <textarea className="textarea" rows={2} placeholder="Includes 1 revision round, 3 pages…" value={form.notes} onChange={set('notes')} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={createProposal} disabled={saving}>
              {saving ? 'Creating…' : 'Create proposal'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? `All (${counts.total})` : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '15px', fontWeight: '600' }}>No proposals yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Proposals don't need a project — create one from any lead.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <PlusCircle size={14} /> New proposal
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(proposal => (
            <div key={proposal.id} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
                      {proposal.title}
                    </p>
                    <span className={`badge ${STATUS_CONFIG[proposal.status]?.cls || 'badge-gray'}`}>
                      {STATUS_CONFIG[proposal.status]?.label || proposal.status}
                    </span>
                    {proposal.leadSource && (
                      <span className="badge badge-blue">
                        {LEAD_SOURCE_LABELS[proposal.leadSource] || proposal.leadSource}
                      </span>
                    )}
                  </div>

                  {/* Client info */}
                  {(proposal.clientName || proposal.companyName) && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <Users size={12} color="var(--text-tertiary)" />
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {proposal.clientName}{proposal.companyName ? ` · ${proposal.companyName}` : ''}
                        {proposal.clientEmail ? ` · ${proposal.clientEmail}` : ''}
                      </p>
                    </div>
                  )}

                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {proposal.project ? `Project: ${proposal.project.name}` : 'No project yet'}
                    {proposal.validUntil && ` · Valid until ${formatDate(proposal.validUntil)}`}
                    {` · ${formatDate(proposal.createdAt)}`}
                  </p>

                  {proposal.notes && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                      {proposal.notes}
                    </p>
                  )}
                </div>

                {/* Right: amount + actions */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px', color: 'var(--text)' }}>
                    {formatCurrency(proposal.amount)}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {proposal.status === 'DRAFT' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(proposal, 'SENT')}>
                        Mark sent
                      </button>
                    )}
                    {(proposal.status === 'DRAFT' || proposal.status === 'SENT') && (
                      <button className="btn btn-secondary btn-sm" style={{ gap: '5px' }} onClick={() => updateStatus(proposal, 'ACCEPTED')}>
                        <CheckCircle2 size={13} /> Accept
                      </button>
                    )}
                    {/* FR-004: Convert to project */}
                    {proposal.status === 'ACCEPTED' && !proposal.projectId && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ gap: '5px' }}
                        onClick={() => convertToProject(proposal)}
                      >
                        <ArrowRight size={13} /> Convert to project
                      </button>
                    )}
                    {proposal.projectId && (
                      <a
                        href={`/bgm/projects`}
                        className="btn btn-ghost btn-sm"
                        style={{ gap: '5px' }}
                      >
                        View project →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
