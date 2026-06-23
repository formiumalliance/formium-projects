'use client'
// app/(dashboard)/pm/updates/PMUpdatesClient.tsx
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { MessageSquare, Send, Eye, EyeOff, PlusCircle } from 'lucide-react'
import { PhaseBadge } from '@/components/projects/HealthBadge'

interface Update {
  id: string
  title: string
  content: string
  phase: string
  isPublished: boolean
  publishedAt?: string | Date | null
  createdAt: string | Date
  project: { id: string; name: string }
  publishedBy: { id: string; name: string }
  _count: { comments: number; feedbackItems: number }
}

interface Props {
  updates: Update[]
  projects: { id: string; name: string }[]
  filters: { projectId?: string; published?: string }
}

export default function PMUpdatesClient({ updates, projects, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [localUpdates, setLocalUpdates] = useState(updates)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set(key, value) : params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  async function togglePublish(update: Update) {
    setTogglingId(update.id)
    const newPublished = !update.isPublished
    const res = await fetch(`/api/projects/${update.project.id}/updates`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updateId: update.id, isPublished: newPublished }),
    })
    if (res.ok) {
      setLocalUpdates(prev =>
        prev.map(u => u.id === update.id
          ? { ...u, isPublished: newPublished, publishedAt: newPublished ? new Date().toISOString() : u.publishedAt }
          : u
        )
      )
      toast.success(newPublished ? 'Update published to client' : 'Update unpublished')
    } else {
      toast.error('Failed to update')
    }
    setTogglingId(null)
  }

  const published = localUpdates.filter(u => u.isPublished).length
  const drafts = localUpdates.filter(u => !u.isPublished).length

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Updates</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {published} published · {drafts} draft{drafts !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto', minWidth: '180px' }}
          value={filters.projectId || ''}
          onChange={e => updateFilter('projectId', e.target.value)}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: '140px' }}
          value={filters.published || ''}
          onChange={e => updateFilter('published', e.target.value)}>
          <option value="">All updates</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
      </div>

      {/* Updates list */}
      {localUpdates.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <MessageSquare size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No updates found</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Post an update from a project page.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {localUpdates.map(update => {
            const isToggling = togglingId === update.id
            return (
              <div key={update.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '500',
                        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                        padding: '2px 8px', borderRadius: '100px',
                      }}>
                        {update.project.name}
                      </span>
                      <PhaseBadge phase={update.phase} />
                      {update.isPublished ? (
                        <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Send size={10} /> Published {update.publishedAt ? formatRelativeTime(update.publishedAt as string) : ''}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                          Draft
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '5px', lineHeight: 1.3 }}>
                      {update.title}
                    </p>

                    {/* Content preview */}
                    <p style={{
                      fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                      marginBottom: '10px',
                    }}>
                      {update.content}
                    </p>

                    {/* Footer */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {update.publishedBy.name} · {formatDate(update.createdAt as string)}
                      </span>
                      {update._count.comments > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={11} />
                          {update._count.comments} comment{update._count.comments !== 1 ? 's' : ''}
                        </span>
                      )}
                      {update._count.feedbackItems > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--amber)' }}>
                          {update._count.feedbackItems} feedback item{update._count.feedbackItems !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '5px', opacity: isToggling ? 0.5 : 1 }}
                      onClick={() => togglePublish(update)}
                      disabled={isToggling}
                    >
                      {update.isPublished
                        ? <><EyeOff size={13} /> Unpublish</>
                        : <><Send size={13} /> Publish</>
                      }
                    </button>
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
