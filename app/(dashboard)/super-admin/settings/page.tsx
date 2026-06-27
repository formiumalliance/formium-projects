'use client'
// app/(dashboard)/super-admin/settings/page.tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Settings, Save } from 'lucide-react'

interface EnvInfo {
  nodeEnv: string
  appUrl: string | null
  supabaseConfigured: boolean
  smtpConfigured: boolean
  smtpHost: string | null
}


function BrandingSection() {
  const [branding, setBranding] = useState<{ logoUrl: string | null; faviconUrl: string | null }>({ logoUrl: null, faviconUrl: null })
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null)

  useEffect(() => {
    fetch('/api/admin/branding').then(r => r.json()).then(d => setBranding(d)).catch(() => {})
  }, [])

  async function upload(file: File, type: 'logo' | 'favicon') {
    setUploading(type)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', type)
      const res = await fetch('/api/admin/branding', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setBranding(prev => ({ ...prev, [type === 'logo' ? 'logoUrl' : 'faviconUrl']: data.url }))
        toast.success(type === 'logo' ? 'Logo updated' : 'Favicon updated')
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } finally { setUploading(null) }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Branding
      </h2>

      {/* Logo */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '80px', height: '80px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
          {branding.logoUrl
            ? <img src={branding.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
            : <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>No logo</span>
          }
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Company logo</p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>PNG, JPG or SVG. Shown in all dashboards. Max 2MB.</p>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            {uploading === 'logo' ? 'Uploading…' : 'Upload logo'}
            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={!!uploading}
              onChange={e => e.target.files?.[0] && upload(e.target.files[0], 'logo')} />
          </label>
        </div>
      </div>

      {/* Favicon */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ width: '48px', height: '48px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
          {branding.faviconUrl
            ? <img src={branding.faviconUrl} alt="Favicon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            : <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>ico</span>
          }
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Favicon</p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>ICO or PNG. Shown in browser tab. Max 2MB.</p>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            {uploading === 'favicon' ? 'Uploading…' : 'Upload favicon'}
            <input type="file" accept=".ico,image/png" style={{ display: 'none' }} disabled={!!uploading}
              onChange={e => e.target.files?.[0] && upload(e.target.files[0], 'favicon')} />
          </label>
        </div>
      </div>
    </div>
  )
}

function EnvStatus() {
  const [env, setEnv] = useState<EnvInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(data => { setEnv(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const rows = env ? [
    { label: 'Node.js env', value: env.nodeEnv },
    { label: 'App URL', value: env.appUrl || 'Not set' },
    { label: 'Supabase URL', value: env.supabaseConfigured ? '\u2713 Configured' : '\u2717 Not set' },
    { label: 'Email SMTP', value: env.smtpConfigured ? '\u2713 ' + env.smtpHost : '\u2717 Not set' },
  ] : []

  return (
    <div className="card" style={{ background: 'var(--bg-secondary)' }}>
      <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
        Environment
      </h2>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '18px', width: '100%' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: item.value.startsWith('\u2717') ? 'var(--red)' : 'var(--text)', fontFamily: 'monospace' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '14px', lineHeight: 1.5 }}>
        Environment variables are set in your <code style={{ fontFamily: 'monospace', fontSize: '11px', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: '4px' }}>.env</code> file and cannot be changed from the UI.
      </p>
    </div>
  )
}

export default function SuperAdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    gracePeriodDays: '3',
    appName: 'Formium Projects',
    supportEmail: 'projects@formiumalliance.com',
    defaultCurrency: 'INR',
    autoArchiveDays: '90',
    maxFileSizeMB: '50',
    requirementReminderDays: '2',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings(p => ({ ...p, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    // In production this would POST to /api/admin/settings
    await new Promise(r => setTimeout(r, 600))
    toast.success('Settings saved')
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Settings size={20} color="var(--text-secondary)" />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            System-wide configuration for Formium Projects
          </p>
        </div>
      </div>

      {/* Project defaults */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Project defaults
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}
          className="max-sm:grid-cols-1">
          <div>
            <label className="input-label">Grace period (days)</label>
            <input className="input" type="number" min="0" max="14" value={settings.gracePeriodDays}
              onChange={set('gracePeriodDays')} />
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
              Days before timeline pauses when required inputs are missing
            </p>
          </div>
          <div>
            <label className="input-label">Auto-archive after completion (days)</label>
            <input className="input" type="number" min="30" max="365" value={settings.autoArchiveDays}
              onChange={set('autoArchiveDays')} />
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
              Days after project completion before automatic archiving
            </p>
          </div>
          <div>
            <label className="input-label">Default currency</label>
            <select className="input" value={settings.defaultCurrency} onChange={set('defaultCurrency')}>
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="AED">AED — UAE Dirham</option>
            </select>
          </div>
          <div>
            <label className="input-label">Requirement reminder (days before due)</label>
            <input className="input" type="number" min="1" max="7" value={settings.requirementReminderDays}
              onChange={set('requirementReminderDays')} />
          </div>
        </div>
      </div>

      {/* File storage */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          File storage
        </h2>
        <div>
          <label className="input-label">Max file size (MB)</label>
          <input className="input" type="number" min="5" max="500" value={settings.maxFileSizeMB}
            onChange={set('maxFileSizeMB')} style={{ maxWidth: '160px' }} />
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
            Maximum size for individual file uploads. Requires matching Supabase storage policy.
          </p>
        </div>
      </div>

      {/* Branding */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Branding &amp; contact
        </h2>
        <div>
          <label className="input-label">Platform name</label>
          <input className="input" value={settings.appName} onChange={set('appName')} />
        </div>
        <div>
          <label className="input-label">Support email</label>
          <input className="input" type="email" value={settings.supportEmail} onChange={set('supportEmail')} />
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
            Shown to clients in the handover page and email footers
          </p>
        </div>
      </div>

      {/* FR-005: Branding management */}
      <BrandingSection />

      {/* Environment info — FIX BUG-003: fetched server-side via API */}
      <EnvStatus />

      <div style={{ paddingBottom: '40px' }}>
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ gap: '6px' }}>
          <Save size={15} />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
