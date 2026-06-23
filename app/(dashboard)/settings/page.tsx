'use client'
// app/(dashboard)/settings/page.tsx
// Accessible from all portals — shared user profile & password change
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:             'Super Admin',
  PROJECT_HEAD:            'Project Head',
  PROJECT_MANAGER:         'Project Manager',
  BUSINESS_GROWTH_MANAGER: 'Business Growth Manager',
  DEVELOPER:               'Developer',
  CLIENT_ADMIN:            'Client Admin',
  CLIENT_MEMBER:           'Client Member',
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const user = session?.user

  const [profileForm, setProfileForm] = useState({
    name:  user?.name  || '',
    phone: '',
  })
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })
  const [showPw,        setShowPw]        = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw,      setSavingPw]      = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    setSavingProfile(true)
    const res  = await fetch(`/api/users/${user.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: profileForm.name, phone: profileForm.phone }),
    })
    if (res.ok) {
      await update({ name: profileForm.name })
      toast.success('Profile updated')
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to update profile')
    }
    setSavingProfile(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSavingPw(true)
    const res  = await fetch(`/api/users/${user.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Password changed successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      toast.error(data.error || 'Failed to change password')
    }
    setSavingPw(false)
  }

  return (
    <div style={{ maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Account</h1>

      {/* Avatar + role */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '100%',
          background: 'var(--accent-muted)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: '700', flexShrink: 0,
        }}>
          {user?.name ? getInitials(user.name) : '?'}
        </div>
        <div>
          <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>
            {user?.name}
          </p>
          <span className="badge badge-blue" style={{ fontSize: '12px' }}>
            {ROLE_LABELS[user?.role as string] || user?.role}
          </span>
        </div>
      </div>

      {/* Profile */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
          <User size={15} color="var(--text-secondary)" />
          <h2 style={{ fontSize: '14px', fontWeight: '600' }}>Profile</h2>
        </div>

        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Full name</label>
            <input
              className="input"
              value={profileForm.name}
              onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="input-label">Email address</label>
            <input
              className="input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
              Email cannot be changed. Contact a Super Admin if needed.
            </p>
          </div>
          <div>
            <label className="input-label">Phone (optional)</label>
            <input
              className="input"
              placeholder="+91 98765 43210"
              value={profileForm.phone}
              onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            style={{ alignSelf: 'flex-start' }}
            disabled={savingProfile}
          >
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
          <Lock size={15} color="var(--text-secondary)" />
          <h2 style={{ fontSize: '14px', fontWeight: '600' }}>Change password</h2>
        </div>

        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Current password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: '10px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', padding: '4px',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">New password</label>
            <input
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="input-label">Confirm new password</label>
            <input
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="Repeat new password"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-secondary btn-sm"
            style={{ alignSelf: 'flex-start' }}
            disabled={savingPw}
          >
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
