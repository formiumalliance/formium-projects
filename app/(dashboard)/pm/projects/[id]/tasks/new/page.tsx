'use client'
// app/(dashboard)/pm/projects/[id]/tasks/new/page.tsx
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const PHASE_OPTIONS = [
  { value: 'REQUIREMENTS_COLLECTION', label: 'Requirements Collection' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'BUILDING', label: 'Building' },
  { value: 'REVIEW_FEEDBACK', label: 'Review & Feedback' },
  { value: 'LAUNCH', label: 'Launch' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

export default function NewTaskPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [form, setForm] = useState({
    title: '',
    description: '',
    phase: 'BUILDING',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    estimatedHours: '',
  })
  const [developers, setDevelopers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load project developers
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(data => {
        const devs = data.data?.developers?.map((d: any) => d.user) || []
        setDevelopers(devs)
      })
  }, [projectId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) { toast.error('Task title is required'); return }
    setLoading(true)

    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        phase: form.phase,
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
        dueDate: form.dueDate || undefined,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Failed to create task')
      setLoading(false)
      return
    }

    toast.success('Task created')
    router.push(`/pm/projects/${projectId}`)
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '28px' }}>
        <Link
          href={`/pm/projects/${projectId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px', textDecoration: 'none' }}
        >
          <ArrowLeft size={13} /> Back to project
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Add task</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Task title *</label>
            <input className="input" placeholder="e.g. Homepage development" value={form.title} onChange={set('title')} autoFocus required />
          </div>
          <div>
            <label className="input-label">Description (optional)</label>
            <textarea className="textarea" placeholder="What needs to be done, acceptance criteria, links…" rows={4} value={form.description} onChange={set('description')} />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">Phase *</label>
              <select className="input" value={form.phase} onChange={set('phase')}>
                {PHASE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="input-label">Assign to</label>
              <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">— Unassigned —</option>
                {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Due date</label>
              <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>

          <div>
            <label className="input-label">Estimated hours</label>
            <input className="input" type="number" min="0" step="0.5" placeholder="4" value={form.estimatedHours} onChange={set('estimatedHours')} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create task'}
          </button>
          <Link href={`/pm/projects/${projectId}`} className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
