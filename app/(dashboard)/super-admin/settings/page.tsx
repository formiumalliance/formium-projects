'use client'
// app/(dashboard)/super-admin/settings/page.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { Settings, Save, RefreshCw } from 'lucide-react'

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

      {/* Environment info */}
      <div className="card" style={{ background: 'var(--bg-secondary)' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
          Environment
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Node.js env', value: process.env.NODE_ENV || 'development' },
            { label: 'App URL', value: process.env.NEXT_PUBLIC_APP_URL || 'Not set' },
            { label: 'Supabase URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configured' : '✗ Not set' },
            { label: 'Email SMTP', value: process.env.SMTP_HOST ? `✓ ${process.env.SMTP_HOST}` : '✗ Not set' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', fontFamily: 'monospace' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '14px', lineHeight: 1.5 }}>
          Environment variables are set in your <code style={{ fontFamily: 'monospace', fontSize: '11px', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: '4px' }}>.env</code> file
          and cannot be changed from the UI. Restart the server after any .env changes.
        </p>
      </div>

      <div style={{ paddingBottom: '40px' }}>
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ gap: '6px' }}>
          <Save size={15} />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
