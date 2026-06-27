'use client'
// app/(dashboard)/pm/projects/new/page.tsx — shared by PM, BGM, Super Admin, Project Head
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { PROJECT_TYPE_LABELS } from '@/types'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface UserOption { id: string; name: string; email: string; role: string }
// FIX BUG-006: ClientOption now uses profileId (ClientProfile.id) not userId
interface ClientOption { profileId: string; userId: string; name: string; email: string; companyName?: string }

// FIX BUG-004/005: role-aware redirect targets after project creation
const PORTAL_ROUTES: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/projects',
  PROJECT_HEAD: '/project-head/projects',
  PROJECT_MANAGER: '/pm/projects',
  BUSINESS_GROWTH_MANAGER: '/bgm/projects',
}

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [pms, setPMs] = useState<UserOption[]>([])
  const [heads, setHeads] = useState<UserOption[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [form, setForm] = useState({
    name: '',
    type: 'BUSINESS_WEBSITE',
    description: '',
    clientProfileId: '',
    projectManagerId: '',
    projectHeadId: '',
    proposedBudget: '',
    agreedBudget: '',
    currency: 'INR',
    startDate: '',
    expectedEndDate: '',
    useTemplate: true,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users?role=PROJECT_MANAGER'),
      fetch('/api/admin/users?role=PROJECT_HEAD'),
      fetch('/api/admin/users?role=CLIENT_ADMIN'),
    ]).then(async ([pmRes, headRes, clientRes]) => {
      const [pmData, headData, clientData] = await Promise.all([
        pmRes.json(), headRes.json(), clientRes.json(),
      ])
      setPMs(pmData.data || [])
      setHeads(headData.data || [])
      // FIX BUG-006: map to ClientProfile.id (profileId), not User.id
      setClients(
        (clientData.data || [])
          .filter((u: any) => u.clientProfile?.id)
          .map((u: any) => ({
            profileId: u.clientProfile.id,
            userId: u.id,
            name: u.name,
            email: u.email,
            companyName: u.clientProfile?.companyName,
          }))
      )
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.type) {
      toast.error('Project name and type are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          proposedBudget: form.proposedBudget ? Number(form.proposedBudget) : undefined,
          agreedBudget: form.agreedBudget ? Number(form.agreedBudget) : undefined,
          // Send undefined (not empty string) for optional FK fields
          clientProfileId: form.clientProfileId || undefined,
          projectManagerId: form.projectManagerId || undefined,
          projectHeadId: form.projectHeadId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create project')
        return
      }

      toast.success('Project created successfully')
      // FIX BUG-004/005: redirect to correct portal based on role
      const role = session?.user?.role as string
      const basePath = PORTAL_ROUTES[role] || '/pm/projects'
      router.push(basePath + '/' + data.data.id)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '28px' }}>
        <Link
          href=".."
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px', textDecoration: 'none' }}
        >
          <ArrowLeft size={13} />
          Back to projects
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>New project</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Set up a new project. A template will auto-generate tasks, folders and requirements.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Project basics</h2>
          <div>
            <label className="input-label">Project name *</label>
            <input className="input" placeholder="Sunrise Interiors — Business Website" value={form.name} onChange={set('name')} required autoFocus />
          </div>
          <div>
            <label className="input-label">Project type *</label>
            <select className="input" value={form.type} onChange={set('type')}>
              {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Description (optional)</label>
            <textarea className="textarea" placeholder="Brief description of the project scope…" value={form.description} onChange={set('description')} rows={3} />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Team assignment</h2>
          <div>
            <label className="input-label">Client</label>
            <select className="input" value={form.clientProfileId} onChange={set('clientProfileId')}>
              <option value="">— Select client —</option>
              {clients.map(c => (
                <option key={c.profileId} value={c.profileId}>
                  {c.name}{c.companyName ? ' (' + c.companyName + ')' : ''}
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                No client accounts found. Create a Client Admin user first.
              </p>
            )}
          </div>
          <div>
            <label className="input-label">Project Manager</label>
            <select className="input" value={form.projectManagerId} onChange={set('projectManagerId')}>
              <option value="">— Select PM —</option>
              {pms.map(pm => (<option key={pm.id} value={pm.id}>{pm.name}</option>))}
            </select>
          </div>
          <div>
            <label className="input-label">Project Head</label>
            <select className="input" value={form.projectHeadId} onChange={set('projectHeadId')}>
              <option value="">— Select Project Head —</option>
              {heads.map(h => (<option key={h.id} value={h.id}>{h.name}</option>))}
            </select>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budget &amp; timeline</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">Proposed budget (₹)</label>
              <input className="input" type="number" placeholder="75000" value={form.proposedBudget} onChange={set('proposedBudget')} />
            </div>
            <div>
              <label className="input-label">Agreed budget (₹)</label>
              <input className="input" type="number" placeholder="70000" value={form.agreedBudget} onChange={set('agreedBudget')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">Start date</label>
              <input className="input" type="date" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div>
              <label className="input-label">Expected end date</label>
              <input className="input" type="date" value={form.expectedEndDate} onChange={set('expectedEndDate')} />
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', cursor: 'pointer', borderColor: form.useTemplate ? 'var(--accent)' : 'var(--border)', background: form.useTemplate ? 'var(--accent-muted)' : 'var(--bg)' }}
          onClick={() => setForm(f => ({ ...f, useTemplate: !f.useTemplate }))}
        >
          <div style={{ width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, marginTop: '2px', border: '2px solid ' + (form.useTemplate ? 'var(--accent)' : 'var(--border-strong)'), background: form.useTemplate ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {form.useTemplate && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <Sparkles size={14} color="var(--accent)" />
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Auto-generate from template</p>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Automatically creates tasks, folders, requirements and milestones based on the project type.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingBottom: '40px' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Creating project…' : 'Create project'}
          </button>
          <Link href=".." className="btn btn-secondary btn-lg">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
