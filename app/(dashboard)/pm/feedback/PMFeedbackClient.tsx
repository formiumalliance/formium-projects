'use client'
// app/(dashboard)/pm/feedback/PMFeedbackClient.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, CheckCircle2, Clock, Circle, XCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  OPEN: { label: 'Open', color: 'var(--red)', icon: Circle },
  IN_PROGRESS: { label: 'In Progress', color: 'var(--blue)', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'var(--green)', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', color: 'var(--text-tertiary)', icon: XCircle },
}

interface FeedbackItem {
  id: string
  title: string
  description?: string | null
  status: string
  createdAt: string
  project: { id: string; name: string; slug: string }
  comment?: { user: { name: string; role: string } } | null
  assignee?: { id: string; name: string } | null
}

interface Props {
  feedbackItems: FeedbackItem[]
  developers: { id: string; name: string; role: string }[]
}

export default function PMFeedbackClient({ feedbackItems: initial, developers }: Props) {
  const [items, setItems] = useState(initial)
  const [filter, setFilter] = useState<string>('OPEN')

  const filtered = items.filter(i => filter === 'ALL' || i.status === filter)

  const counts = {
    OPEN: items.filter(i => i.status === 'OPEN').length,
    IN_PROGRESS: items.filter(i => i.status === 'IN_PROGRESS').length,
    RESOLVED: items.filter(i => i.status === 'RESOLVED').length,
    CLOSED: items.filter(i => i.status === 'CLOSED').length,
  }

  async function updateStatus(id: string, status: string, projectId: string, assigneeId?: string) {
    const res = await fetch(`/api/projects/${projectId}/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assigneeId }),
    })
    if (res.ok) {
      setItems(prev => prev.map(i =>
        i.id === id
          ? { ...i, status, assignee: assigneeId ? developers.find(d => d.id === assigneeId) || i.assignee : i.assignee }
          : i
      ))
      toast.success('Feedback updated')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Feedback Tracker</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Client comments converted to trackable feedback items.
        </p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'OPEN', label: 'Open', count: counts.OPEN },
          { key: 'IN_PROGRESS', label: 'In Progress', count: counts.IN_PROGRESS },
          { key: 'RESOLVED', label: 'Resolved', count: counts.RESOLVED },
          { key: 'ALL', label: 'All', count: items.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: filter === tab.key ? '600' : '400',
              color: filter === tab.key ? 'var(--text)' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${filter === tab.key ? 'var(--accent)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '-1px',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                fontSize: '11px', fontWeight: '600',
                background: filter === tab.key ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
                color: filter === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: '100px', padding: '1px 6px',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={28} color="var(--text-tertiary)" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            No {filter.toLowerCase()} feedback items
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(item => {
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN

            return (
              <div key={item.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {/* Status icon */}
                  <statusCfg.icon
                    size={16}
                    color={statusCfg.color}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                        {item.title}
                      </p>
                      <span style={{
                        fontSize: '11px', fontWeight: '500',
                        color: statusCfg.color,
                        background: `${statusCfg.color}18`,
                        padding: '2px 8px', borderRadius: '100px', flexShrink: 0,
                      }}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {item.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '100px' }}>
                        {item.project.name}
                      </span>
                      {item.comment?.user && (
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          from {item.comment.user.name}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {formatRelativeTime(item.createdAt)}
                      </span>
                      {item.assignee && (
                        <span style={{ fontSize: '12px', color: 'var(--blue)' }}>
                          → {item.assignee.name}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {item.status === 'OPEN' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => updateStatus(item.id, 'IN_PROGRESS', item.project.id)}
                        >
                          Start working
                        </button>
                      )}
                      {item.status === 'IN_PROGRESS' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--green)', borderColor: 'rgba(22,163,74,0.2)' }}
                          onClick={() => updateStatus(item.id, 'RESOLVED', item.project.id)}
                        >
                          Mark resolved
                        </button>
                      )}
                      {['OPEN', 'IN_PROGRESS'].includes(item.status) && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--text-tertiary)' }}
                          onClick={() => updateStatus(item.id, 'CLOSED', item.project.id)}
                        >
                          Dismiss
                        </button>
                      )}

                      {/* Assign dropdown */}
                      {['OPEN', 'IN_PROGRESS'].includes(item.status) && (
                        <select
                          className="input"
                          style={{ height: '30px', fontSize: '12px', padding: '0 8px', width: 'auto' }}
                          value={item.assignee?.id || ''}
                          onChange={e => updateStatus(item.id, item.status, item.project.id, e.target.value || undefined)}
                        >
                          <option value="">Assign to…</option>
                          {developers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
