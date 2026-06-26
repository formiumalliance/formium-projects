'use client'
// app/(dashboard)/client/updates/ClientUpdatesClient.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { formatRelativeTime, formatDate, getInitials } from '@/lib/utils'
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react'

const PHASE_CLIENT_LABELS: Record<string, string> = {
  REQUIREMENTS_COLLECTION: 'Requirements Collection',
  PLANNING: 'Planning',
  BUILDING: 'Building Your Project',
  REVIEW_FEEDBACK: 'Review & Feedback',
  LAUNCH: 'Launch',
}

const ROLE_LABELS: Record<string, string> = {
  PROJECT_MANAGER: 'Project Manager',
  SUPER_ADMIN: 'Formium Team',
  PROJECT_HEAD: 'Project Head',
  DEVELOPER: 'Developer',
  CLIENT_ADMIN: 'You',
  CLIENT_MEMBER: 'Team Member',
}

interface Comment {
  id: string
  content: string
  createdAt: string | Date
  updatedAt?: string | Date
  userId?: string
  projectId?: string | null
  updateId?: string | null
  parentId?: string | null
  isEdited?: boolean

  user: {
    id: string
    name: string
    avatar?: string | null
    role: string
  }

  replies?: Comment[]
}

interface Update {
  id: string
  title: string
  content: string
  phase: string
  publishedAt?: string | null
  publishedBy: {
    id: string
    name: string
    avatar?: string | null
  }
  project: {
    id: string
    name: string
    slug: string
  }
  attachments: any[]
  comments: Comment[]
}
interface Props {
  updates: Update[]
  userId: string
}

function CommentBubble({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
  const isInternal = ['PROJECT_MANAGER', 'SUPER_ADMIN', 'PROJECT_HEAD', 'DEVELOPER'].includes(comment.user.role)

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      paddingLeft: isReply ? '36px' : '0',
    }}>
      <div className="avatar" style={{
        width: '28px', height: '28px', fontSize: '10px', fontWeight: '700',
        flexShrink: 0,
        background: isInternal ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
        color: isInternal ? 'var(--accent)' : 'var(--text-secondary)',
      }}>
        {getInitials(comment.user.name)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
            {isInternal ? ROLE_LABELS[comment.user.role] || comment.user.name : comment.user.name}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <div style={{
          padding: '10px 12px',
          background: isInternal ? 'var(--bg-secondary)' : 'var(--accent-muted)',
          borderRadius: '8px',
          borderTopLeftRadius: '2px',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  )
}

function UpdateCard({ update, userId }: { update: Update; userId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>(update.comments)
  const [submitting, setSubmitting] = useState(false)

  async function submitComment() {
    if (!commentText.trim()) return
    setSubmitting(true)

    const res = await fetch(`/api/projects/${update.project.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: commentText.trim(),
        updateId: update.id,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setComments(prev => [...prev, data.data])
      setCommentText('')
      toast.success('Comment added')
    } else {
      toast.error('Failed to add comment')
    }
    setSubmitting(false)
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{
            fontSize: '11px', fontWeight: '500',
            color: 'var(--accent)',
            background: 'var(--accent-muted)',
            padding: '2px 8px',
            borderRadius: '100px',
          }}>
            {PHASE_CLIENT_LABELS[update.phase] || update.phase}
          </span>
          {update.publishedAt && (
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {formatDate(update.publishedAt)}
            </span>
          )}
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px', color: 'var(--text)', marginBottom: '12px' }}>
          {update.title}
        </h2>

        {/* Content */}
        <div style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.65',
          whiteSpace: 'pre-wrap',
          maxHeight: expanded ? 'none' : '120px',
          overflow: expanded ? 'visible' : 'hidden',
          position: 'relative',
        }}>
          {update.content}
          {!expanded && update.content.length > 200 && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '60px',
              background: 'linear-gradient(to bottom, transparent, var(--bg))',
            }} />
          )}
        </div>

        {update.content.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: '8px', gap: '4px', paddingLeft: '0', color: 'var(--text-secondary)' }}
          >
            {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
          </button>
        )}

        {/* Posted by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '9px', fontWeight: '700', background: 'var(--accent-muted)', color: 'var(--accent)' }}>
            {getInitials(update.publishedBy.name)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {update.publishedBy.name}
          </span>
        </div>
      </div>

      {/* Comments */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px' }}>
        {/* Comment count */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: comments.length > 0 ? '16px' : '12px' }}>
          <MessageSquare size={13} color="var(--text-tertiary)" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {comments.length === 0 ? 'Leave a comment' : `${comments.length} comment${comments.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Comments list */}
        {comments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {comments.map(comment => (
              <div key={comment.id}>
                <CommentBubble comment={comment} />
                {comment.replies?.map(reply => (
                  <div key={reply.id} style={{ marginTop: '8px' }}>
                    <CommentBubble comment={reply} isReply />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            className="textarea"
            placeholder="Share your thoughts, feedback or questions…"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            rows={2}
            style={{ flex: 1, minHeight: '60px', fontSize: '13px', resize: 'none' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submitComment()
              }
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={submitComment}
            disabled={!commentText.trim() || submitting}
            style={{ padding: '8px', height: 'auto', flexShrink: 0 }}
            title="Send (Cmd+Enter)"
          >
            <Send size={14} />
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
          Comments are shared with your project manager and become trackable feedback items.
        </p>
      </div>
    </div>
  )
}

export default function ClientUpdatesClient({ updates, userId }: Props) {
  if (updates.length === 0) {
    return (
      <div style={{ maxWidth: '720px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px', marginBottom: '24px' }}>
          Updates
        </h1>
        <div className="empty-state">
          <MessageSquare size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No updates yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Your project manager will post updates here as your project progresses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Updates</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {updates.length} update{updates.length > 1 ? 's' : ''} from your project team
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {updates.map(update => (
          <UpdateCard key={update.id} update={update} userId={userId} />
        ))}
      </div>
    </div>
  )
}
