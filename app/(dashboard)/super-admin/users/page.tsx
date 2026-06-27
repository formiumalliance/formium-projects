'use client'
// app/(dashboard)/super-admin/users/page.tsx - Client component for user management
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Users, PlusCircle, Search, Mail, Phone, ShieldCheck, UserX, UserCheck } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PROJECT_HEAD: 'Project Head',
  PROJECT_MANAGER: 'Project Manager',
  BUSINESS_GROWTH_MANAGER: 'Business Growth Manager',
  DEVELOPER: 'Developer',
  CLIENT_ADMIN: 'Client Admin',
  CLIENT_MEMBER: 'Client Member',
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'badge-red',
  PROJECT_HEAD: 'badge-accent',
  PROJECT_MANAGER: 'badge-blue',
  BUSINESS_GROWTH_MANAGER: 'badge-green',
  DEVELOPER: 'badge-gray',
  CLIENT_ADMIN: 'badge-amber',
  CLIENT_MEMBER: 'badge-gray',
}

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  clientProfile?: { companyName?: string }
  _count: { projectsAsPM: number; developerAssignments: number }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '', email: '', role: 'DEVELOPER', phone: '', companyName: '', tempPassword: '',
  })
  const [createdPassword, setCreatedPassword] = useState('')

  useEffect(() => {
    loadUsers()
  }, [roleFilter])

  async function loadUsers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter) params.set('role', roleFilter)
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.data || [])
    setLoading(false)
  }

  async function createUser() {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error('Name, email and role are required')
      return
    }
    setCreating(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Failed to create user')
      setCreating(false)
      return
    }
    // FIX BUG-001: always show password (email may not have sent)
    setCreatedPassword(data.tempPassword)
    setUsers(prev => [data.data, ...prev])
    setCreating(false)
    if (data.emailSent === false) {
      toast.warning(`User created. Email delivery failed — share the password shown below manually.`)
    } else {
      toast.success(`User created. Temporary password sent to ${newUser.email}`)
    }
    setNewUser({ name: '', email: '', role: 'DEVELOPER', phone: '', companyName: '', tempPassword: '' })
  }

  async function toggleUserActive(userId: string, isActive: boolean) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive: !isActive }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !isActive } : u))
      toast.success(isActive ? 'User deactivated' : 'User reactivated')
    }
  }

  const filtered = users.filter(u =>
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Users</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {users.length} total users
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <PlusCircle size={15} />
          Add user
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            className="input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadUsers()}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select
          className="input"
          style={{ width: '220px' }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Users table */}
      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '100%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '30%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={28} color="var(--text-tertiary)" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No users found</p>
          </div>
        ) : (
          filtered.map((user, i) => (
            <div
              key={user.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: '12px',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: user.isActive ? 1 : 0.5,
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                <div className="avatar avatar-md" style={{
                  background: user.isActive ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
                  color: user.isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                  fontWeight: '700', fontSize: '12px',
                  width: '36px', height: '36px',
                  flexShrink: 0,
                }}>
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '3px' }}>
                    {user.name}
                    {!user.isActive && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '400', marginLeft: '8px' }}>Deactivated</span>}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{user.email}</span>
                    {user.clientProfile?.companyName && (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        · {user.clientProfile.companyName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <span className={`badge ${ROLE_COLORS[user.role] || 'badge-gray'}`} style={{ fontSize: '11px', flexShrink: 0 }}>
                {ROLE_LABELS[user.role] || user.role}
              </span>

              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : 'Never'}
              </p>

              <button
                onClick={() => toggleUserActive(user.id, user.isActive)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '6px', height: 'auto', flexShrink: 0, color: user.isActive ? 'var(--red)' : 'var(--green)' }}
                title={user.isActive ? 'Deactivate user' : 'Reactivate user'}
              >
                {user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create user modal */}
      {showCreateModal && (
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
          <div className="card" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            animation: 'animateIn 0.2s ease-out',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Add user</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Full name</label>
                <input className="input" placeholder="Arjun Sharma" value={newUser.name}
                  onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Email address</label>
                <input className="input" type="email" placeholder="arjun@example.com" value={newUser.email}
                  onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Role</label>
                <select className="input" value={newUser.role}
                  onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Phone (optional)</label>
                <input className="input" placeholder="+91 98765 43210" value={newUser.phone}
                  onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Temporary password (optional)</label>
                <input className="input" type="text" placeholder="Leave blank to auto-generate" value={newUser.tempPassword}
                  onChange={e => setNewUser(p => ({ ...p, tempPassword: e.target.value }))} />
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                  Min 8 characters. A secure password will be generated automatically if left blank.
                </p>
              </div>
              {['CLIENT_ADMIN', 'CLIENT_MEMBER'].includes(newUser.role) && (
                <div>
                  <label className="input-label">Company name</label>
                  <input className="input" placeholder="Client Company Pvt Ltd" value={newUser.companyName}
                    onChange={e => setNewUser(p => ({ ...p, companyName: e.target.value }))} />
                </div>
              )}

              {createdPassword && (
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--green-bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(22, 163, 74, 0.2)',
                }}>
                  <p style={{ fontSize: '13px', color: 'var(--green)', marginBottom: '4px', fontWeight: '500' }}>
                    Temporary password generated:
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '700', color: 'var(--text)', letterSpacing: '0.05em' }}>
                    {createdPassword}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    This was emailed to the user. Copy it now if needed.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowCreateModal(false); setCreatedPassword('') }}
              >
                {createdPassword ? 'Close' : 'Cancel'}
              </button>
              {!createdPassword && (
                <button
                  className="btn btn-primary"
                  onClick={createUser}
                  disabled={creating}
                >
                  {creating ? 'Creating…' : 'Create user'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
