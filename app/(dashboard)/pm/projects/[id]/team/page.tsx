'use client'
// app/(dashboard)/pm/projects/[id]/team/page.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, UserPlus, UserMinus, Users } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface Developer {
  id: string
  user: { id: string; name: string; email: string; avatar?: string | null }
  role?: string | null
  assignedAt: string
}

interface AvailableDev {
  id: string
  name: string
  email: string
  avatar?: string | null
  _count: { developerAssignments: number }
}

export default function ProjectTeamPage() {
  const params = useParams()
  const projectId = params.id as string

  const [assigned, setAssigned] = useState<Developer[]>([])
  const [available, setAvailable] = useState<AvailableDev[]>([])
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedDevId, setSelectedDevId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/developers`),
      fetch('/api/admin/users?role=DEVELOPER'),
      fetch(`/api/projects/${projectId}`),
    ]).then(async ([devRes, availRes, projRes]) => {
      const devData = await devRes.json()
      const availData = await availRes.json()
      const projData = await projRes.json()

      setAssigned(devData.data || [])
      setAvailable(availData.data || [])
      setProjectName(projData.data?.name || '')
      setLoading(false)
    })
  }, [projectId])

  const assignedIds = new Set(assigned.map(d => d.user.id))
  const unassigned = available.filter(d => !assignedIds.has(d.id))

  async function addDeveloper() {
    if (!selectedDevId) { toast.error('Select a developer'); return }
    setAdding(true)
    const res = await fetch(`/api/projects/${projectId}/developers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedDevId, role: selectedRole || undefined }),
    })
    const data = await res.json()
    if (res.ok) {
      setAssigned(prev => [...prev, data.data])
      setSelectedDevId('')
      setSelectedRole('')
      toast.success('Developer added to project')
    } else {
      toast.error(data.error || 'Failed to add developer')
    }
    setAdding(false)
  }

  async function removeDeveloper(userId: string) {
    const res = await fetch(`/api/projects/${projectId}/developers?userId=${userId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setAssigned(prev => prev.filter(d => d.user.id !== userId))
      toast.success('Developer removed from project')
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '700px' }}>
        <div className="skeleton" style={{ height: '36px', width: '200px', marginBottom: '24px' }} />
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '8px', borderRadius: 'var(--radius-lg)' }} />)}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <Link
          href={`/pm/projects/${projectId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px', textDecoration: 'none' }}
        >
          <ArrowLeft size={13} /> Back to project
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Team</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {projectName} — {assigned.length} developer{assigned.length !== 1 ? 's' : ''} assigned
        </p>
      </div>

      {/* Add developer */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600' }}>Add developer</h2>
        {unassigned.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>All available developers are already on this project.</p>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="input"
              style={{ flex: 1, minWidth: '200px' }}
              value={selectedDevId}
              onChange={e => setSelectedDevId(e.target.value)}
            >
              <option value="">— Select developer —</option>
              {unassigned.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d._count.developerAssignments} active project{d._count.developerAssignments !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Role (e.g. Lead Dev, Frontend)"
              style={{ flex: 1, minWidth: '160px' }}
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            />
            <button className="btn btn-primary" onClick={addDeveloper} disabled={adding || !selectedDevId} style={{ gap: '6px', flexShrink: 0 }}>
              <UserPlus size={14} />
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}
      </div>

      {/* Assigned developers */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Users size={14} color="var(--text-secondary)" />
          <h2 style={{ fontSize: '14px', fontWeight: '600' }}>Assigned developers</h2>
        </div>

        {assigned.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px' }}>
            <Users size={24} color="var(--text-tertiary)" />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No developers assigned yet</p>
          </div>
        ) : (
          assigned.map((dev, i) => (
            <div
              key={dev.user.id}
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: i < assigned.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div className="avatar avatar-md" style={{
                background: 'var(--accent-muted)',
                color: 'var(--accent)',
                fontWeight: '700',
                fontSize: '12px',
                width: '36px',
                height: '36px',
              }}>
                {getInitials(dev.user.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>
                  {dev.user.name}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {dev.user.email}
                  {dev.role && ` · ${dev.role}`}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--red)', padding: '6px', height: 'auto' }}
                onClick={() => removeDeveloper(dev.user.id)}
                title="Remove from project"
              >
                <UserMinus size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
