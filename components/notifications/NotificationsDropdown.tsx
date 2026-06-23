'use client'
// components/notifications/NotificationsDropdown.tsx
import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  actionUrl?: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        setNotifications(data.data || [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read' }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  async function handleClick(notification: Notification) {
    if (!notification.isRead) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', notificationId: notification.id }),
      })
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      )
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      onClose()
    }
  }

  const typeIcons: Record<string, string> = {
    PROJECT_CREATED: '🎯',
    TASK_ASSIGNED: '📋',
    UPDATE_PUBLISHED: '📢',
    CHANGE_REQUEST_DECISION: '🔄',
    HANDOVER_READY: '📦',
    COMMENT_ADDED: '💬',
    DEADLINE_APPROACHING: '⏰',
    TIMELINE_PAUSED: '⏸️',
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '360px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        overflow: 'hidden',
        maxHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        animation: 'animateIn 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
          Notifications
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', height: 'auto', fontSize: '12px', gap: '4px' }}
            onClick={markAllRead}
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px', height: 'auto' }}
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ padding: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '100%', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="skeleton" style={{ height: '13px', width: '70%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '90%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={28} color="var(--text-tertiary)" />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>All caught up</p>
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                background: n.isRead ? 'transparent' : 'var(--accent-muted)',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (n.isRead) (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = n.isRead ? 'transparent' : 'var(--accent-muted)'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '100%',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}>
                {typeIcons[n.type] || '📌'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '13px',
                  fontWeight: n.isRead ? '400' : '600',
                  color: 'var(--text)',
                  lineHeight: 1.3,
                  marginBottom: '3px',
                }}>
                  {n.title}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                }}>
                  {n.body}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <div style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '100%',
                  background: 'var(--accent)',
                  flexShrink: 0,
                  marginTop: '4px',
                }} />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
