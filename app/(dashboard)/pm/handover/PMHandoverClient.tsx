'use client'
// app/(dashboard)/pm/handover/PMHandoverClient.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { Package, CheckCircle2, AlertTriangle, ExternalLink, Send } from 'lucide-react'

interface Handover {
  id: string
  status: string
  liveUrl?: string | null
  stagingUrl?: string | null
  repositoryUrl?: string | null
  deploymentPlatform?: string | null
  deploymentNotes?: string | null
  credentialsNotes?: string | null
  maintenanceNotes?: string | null
  generatedAt?: Date | string | null
  clientAcknowledgedAt?: Date | string | null
}

interface Project {
  id: string
  name: string
  status: string
  progress: number
  handover: Handover | null
  clientProfile?: {
    user: { name: string; email: string }
  } | null
}

interface Props {
  projects: Project[]
}

function HandoverForm({ project, onSaved }: { project: Project; onSaved: (h: Handover) => void }) {
  const [form, setForm] = useState({
    liveUrl: project.handover?.liveUrl || '',
    stagingUrl: project.handover?.stagingUrl || '',
    repositoryUrl: project.handover?.repositoryUrl || '',
    deploymentPlatform: project.handover?.deploymentPlatform || '',
    deploymentNotes: project.handover?.deploymentNotes || '',
    credentialsNotes: project.handover?.credentialsNotes || '',
    maintenanceNotes: project.handover?.maintenanceNotes || '',
  })
  const [saving, setSaving] = useState(false)
  const [markingReady, setMarkingReady] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/projects/${project.id}/handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      onSaved(data.data)
      toast.success('Handover details saved')
    } else {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  async function markReady() {
    if (!form.liveUrl && !form.stagingUrl) {
      toast.error('Please add at least a live URL or staging URL before marking ready')
      return
    }
    setMarkingReady(true)
    // Save first
    await save()
    // Then mark ready
    const res = await fetch(`/api/projects/${project.id}/handover?action=mark-ready`, { method: 'PUT' })
    if (res.ok) {
      toast.success('Handover package marked ready — client has been notified!')
    } else {
      toast.error('Failed to mark ready')
    }
    setMarkingReady(false)
  }

  const isReady = project.handover?.status === 'READY'
  const isDelivered = project.handover?.status === 'DELIVERED'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {(isReady || isDelivered) && (
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'center',
          padding: '12px 16px',
          background: isDelivered ? 'var(--green-bg)' : 'var(--accent-muted)',
          borderRadius: 'var(--radius)',
          border: `1px solid ${isDelivered ? 'rgba(22,163,74,0.2)' : 'rgba(255,49,49,0.2)'}`,
        }}>
          <CheckCircle2 size={16} color={isDelivered ? 'var(--green)' : 'var(--accent)'} />
          <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>
            {isDelivered
              ? `Client acknowledged handover${project.handover?.clientAcknowledgedAt ? ' ✓' : ''}`
              : 'Handover package sent to client — waiting for acknowledgement'}
          </p>
        </div>
      )}

      {/* URLs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
        className="max-sm:grid-cols-1"
      >
        <div>
          <label className="input-label">Live URL</label>
          <input className="input" placeholder="https://clientsite.com" value={form.liveUrl} onChange={set('liveUrl')} />
        </div>
        <div>
          <label className="input-label">Staging URL</label>
          <input className="input" placeholder="https://staging.clientsite.com" value={form.stagingUrl} onChange={set('stagingUrl')} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
        className="max-sm:grid-cols-1"
      >
        <div>
          <label className="input-label">Repository URL</label>
          <input className="input" placeholder="https://github.com/…" value={form.repositoryUrl} onChange={set('repositoryUrl')} />
        </div>
        <div>
          <label className="input-label">Deployment platform</label>
          <input className="input" placeholder="Hostinger / Vercel / AWS / cPanel" value={form.deploymentPlatform} onChange={set('deploymentPlatform')} />
        </div>
      </div>

      <div>
        <label className="input-label">Deployment notes</label>
        <textarea className="textarea" rows={3}
          placeholder="How to deploy, build commands, environment setup…"
          value={form.deploymentNotes} onChange={set('deploymentNotes')} />
      </div>

      <div>
        <label className="input-label">
          Credentials &amp; access details
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '400', marginLeft: '6px' }}>
            (included in ZIP — keep minimal, use password manager)
          </span>
        </label>
        <textarea className="textarea" rows={4}
          placeholder="cPanel login: user/pass&#10;Admin panel: https://…/wp-admin user/pass&#10;Database: host/user/pass/name&#10;API keys: …"
          value={form.credentialsNotes} onChange={set('credentialsNotes')} />
      </div>

      <div>
        <label className="input-label">Maintenance notes</label>
        <textarea className="textarea" rows={3}
          placeholder="How to update content, renew SSL, backup instructions…"
          value={form.maintenanceNotes} onChange={set('maintenanceNotes')} />
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        {!isReady && !isDelivered && (
          <button
            className="btn btn-primary"
            onClick={markReady}
            disabled={markingReady}
            style={{ gap: '6px' }}
          >
            <Send size={14} />
            {markingReady ? 'Processing…' : 'Mark ready & notify client'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function PMHandoverClient({ projects }: Props) {
  const [handovers, setHandovers] = useState<Record<string, Handover>>(
    Object.fromEntries(projects.filter(p => p.handover).map(p => [p.id, p.handover!]))
  )
  const [expandedId, setExpandedId] = useState<string | null>(
    projects.find(p => p.status === 'REVIEW' || p.status === 'COMPLETED')?.id || null
  )

  if (projects.length === 0) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px', marginBottom: '24px' }}>Handover</h1>
        <div className="empty-state">
          <Package size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            No projects ready for handover yet
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Handover</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Prepare and deliver project handover packages to clients.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {projects.map(project => {
          const handover = handovers[project.id] || project.handover
          const isExpanded = expandedId === project.id
          const statusColor = handover?.status === 'DELIVERED' ? 'var(--green)'
            : handover?.status === 'READY' ? 'var(--accent)'
            : handover?.status === 'PREPARING' ? 'var(--blue)'
            : 'var(--text-tertiary)'

          return (
            <div key={project.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%', padding: '16px 20px',
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <Package size={16} color={statusColor} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>
                    {project.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {project.clientProfile?.user?.name}
                    {` · ${project.progress}% complete`}
                  </p>
                </div>

                <span style={{
                  fontSize: '11px', fontWeight: '500',
                  color: statusColor,
                  background: `${statusColor}18`,
                  padding: '3px 10px', borderRadius: '100px', flexShrink: 0,
                }}>
                  {handover?.status === 'DELIVERED' ? 'Delivered'
                    : handover?.status === 'READY' ? 'Ready — Awaiting Client'
                    : handover?.status === 'PREPARING' ? 'Preparing'
                    : 'Not started'}
                </span>

                <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded form */}
              {isExpanded && (
                <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
                  <HandoverForm
                    project={project}
                    onSaved={h => setHandovers(prev => ({ ...prev, [project.id]: h }))}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
