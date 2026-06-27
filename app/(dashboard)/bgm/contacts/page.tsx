'use client'
// app/(dashboard)/bgm/contacts/page.tsx — FR-002: Contact Sphere module
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Users, PlusCircle, X, Search, Building2, Phone, Mail } from 'lucide-react'

const CATEGORIES = ['Agency', 'Direct Client', 'Referral Partner', 'Vendor', 'Investor', 'Other']

interface Contact {
  id: string; contactName: string; companyName?: string | null
  category?: string | null; phone?: string | null; email?: string | null
  notes?: string | null; createdAt: string
  totalProposals: number; acceptedProposals: number; totalBusinessGenerated: number
}

const EMPTY = { contactName: '', companyName: '', category: '', phone: '', email: '', notes: '' }

export default function ContactSpherePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({ ...EMPTY })

  useEffect(() => {
    fetch('/api/contact-sphere' + (search ? `?search=${encodeURIComponent(search)}` : ''))
      .then(r => r.json())
      .then(d => { setContacts(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search])

  async function createContact() {
    if (!form.contactName) { toast.error('Contact name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/contact-sphere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setContacts(prev => [{ ...data.data, totalProposals: 0, acceptedProposals: 0, totalBusinessGenerated: 0 }, ...prev])
        setForm({ ...EMPTY })
        setShowForm(false)
        toast.success('Contact added')
      } else {
        toast.error(data.error || 'Failed')
      }
    } finally { setSaving(false) }
  }

  async function deleteContact(id: string) {
    if (!confirm('Delete this contact?')) return
    const res = await fetch(`/api/contact-sphere/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setContacts(prev => prev.filter(c => c.id !== id))
      toast.success('Contact deleted')
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const totalBiz = contacts.reduce((s, c) => s + c.totalBusinessGenerated, 0)

  return (
    <div style={{ maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Contact Sphere</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {contacts.length} contacts · {formatCurrency(totalBiz)} total business
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={15} /> Add contact
        </button>
      </div>

      {/* Add contact form */}
      {showForm && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Add contact</h2>
            <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }} onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="form-grid-2">
            <div>
              <label className="input-label">Contact name *</label>
              <input className="input" placeholder="Rahul Sharma" value={form.contactName} onChange={set('contactName')} autoFocus />
            </div>
            <div>
              <label className="input-label">Company</label>
              <input className="input" placeholder="Acme Corp" value={form.companyName} onChange={set('companyName')} />
            </div>
          </div>
          <div className="form-grid-2">
            <div>
              <label className="input-label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Phone</label>
              <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div>
            <label className="input-label">Email</label>
            <input className="input" type="email" placeholder="rahul@acme.com" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="input-label">Notes</label>
            <textarea className="textarea" rows={2} placeholder="How we know them, past collaborations…" value={form.notes} onChange={set('notes')} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={createContact} disabled={saving}>
              {saving ? 'Saving…' : 'Add contact'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          className="input"
          style={{ paddingLeft: '36px' }}
          placeholder="Search contacts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '90px' }} />)}
        </div>
      ) : contacts.length === 0 ? (
        <div className="empty-state">
          <Users size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '15px', fontWeight: '600' }}>No contacts yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Add companies and individuals who generate business.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {contacts.map(c => (
            <div key={c.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px' }}>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>{c.contactName}</p>
                    {c.category && <span className="badge badge-gray">{c.category}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {c.companyName && (
                      <span style={{ display: 'flex', gap: '5px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Building2 size={12} /> {c.companyName}
                      </span>
                    )}
                    {c.phone && (
                      <span style={{ display: 'flex', gap: '5px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Phone size={12} /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span style={{ display: 'flex', gap: '5px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Mail size={12} /> {c.email}
                      </span>
                    )}
                  </div>
                  {c.notes && <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{c.notes}</p>}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--green)', letterSpacing: '-0.3px' }}>
                    {formatCurrency(c.totalBusinessGenerated)}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {c.acceptedProposals}/{c.totalProposals} proposals won
                  </p>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: '8px', color: 'var(--red)', fontSize: '12px' }}
                    onClick={() => deleteContact(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
