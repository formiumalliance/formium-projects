'use client'
// app/(dashboard)/pm/projects/[id]/updates/new/page.tsx
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Eye, Send } from 'lucide-react'
import Link from 'next/link'

const PHASE_LABELS: Record<string, string> = {
  REQUIREMENTS_COLLECTION: 'Requirements Collection',
  PLANNING: 'Planning',
  BUILDING: 'Building',
  REVIEW_FEEDBACK: 'Review & Feedback',
  LAUNCH: 'Launch',
}

export default function NewUpdatePage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [form, setForm] = useState({
    title: '',
    content: '',
    phase: 'BUILDING',
    isPublished: false,
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(publish: boolean) {
    if (!form.title || !form.content) {
      toast.error('Title and content are required')
      return
    }

    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, isPublished: publish }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Failed to save update')
      setLoading(false)
      return
    }

    toast.success(publish ? 'Update published to client' : 'Update saved as draft')
    router.push(`/pm/projects/${projectId}`)
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '28px' }}>
        <Link
          href={`/pm/projects/${projectId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px', textDecoration: 'none' }}
        >
          <ArrowLeft size={13} />
          Back to project
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Post update</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Share progress with the client. Clients can comment and you can track their feedback.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="input-label">Update title</label>
          <input
            className="input"
            placeholder="Homepage design approved — development begins"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
            style={{ fontSize: '16px', height: '46px' }}
          />
        </div>

        <div>
          <label className="input-label">Phase</label>
          <select
            className="input"
            value={form.phase}
            onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}
          >
            {Object.entries(PHASE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Update content</label>
          <textarea
            className="textarea"
            placeholder="Describe what was accomplished, what the client will see, and what comes next…&#10;&#10;You can include links, mention specific features, and explain any decisions made."
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={12}
            style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6' }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            Write for the client — avoid internal jargon. Clients see phase labels like "Building" not "BUILDING".
          </p>
        </div>

        {/* Preview note */}
        <div style={{
          padding: '14px 16px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            💡 <strong>Publishing</strong> immediately notifies the client by email and in-app.
            <strong> Saving as draft</strong> lets you edit and publish later.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingBottom: '40px' }}>
          <button
            className="btn btn-primary"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            style={{ gap: '6px' }}
          >
            <Send size={14} />
            {loading ? 'Publishing…' : 'Publish to client'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            style={{ gap: '6px' }}
          >
            <Eye size={14} />
            Save as draft
          </button>
          <Link href={`/pm/projects/${projectId}`} className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
