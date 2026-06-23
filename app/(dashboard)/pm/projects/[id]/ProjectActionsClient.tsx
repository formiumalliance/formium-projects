'use client'
// app/(dashboard)/pm/projects/[id]/ProjectActionsClient.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Settings, ChevronDown, Play, Pause, CheckCircle, Archive } from 'lucide-react'
import Link from 'next/link'

interface Props {
  project: {
    id: string
    status: string
    phase: string
    timelinePaused: boolean
    slug: string
  }
}

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; icon: typeof Play }[]> = {
  DRAFT: [{ label: 'Move to Proposal', next: 'PROPOSAL', icon: Play }],
  PROPOSAL: [{ label: 'Mark Payment Received', next: 'AWAITING_PAYMENT', icon: Play }],
  AWAITING_PAYMENT: [{ label: 'Activate Project', next: 'ACTIVE', icon: Play }],
  ACTIVE: [
    { label: 'Put On Hold', next: 'ON_HOLD', icon: Pause },
    { label: 'Move to Review', next: 'REVIEW', icon: CheckCircle },
    { label: 'Mark Complete', next: 'COMPLETED', icon: CheckCircle },
  ],
  ON_HOLD: [{ label: 'Reactivate', next: 'ACTIVE', icon: Play }],
  REVIEW: [{ label: 'Mark Complete', next: 'COMPLETED', icon: CheckCircle }],
}

const PHASE_PROGRESSION = [
  'REQUIREMENTS_COLLECTION',
  'PLANNING',
  'BUILDING',
  'REVIEW_FEEDBACK',
  'LAUNCH',
]

const PHASE_LABELS: Record<string, string> = {
  REQUIREMENTS_COLLECTION: 'Requirements',
  PLANNING: 'Planning',
  BUILDING: 'Building',
  REVIEW_FEEDBACK: 'Review & Feedback',
  LAUNCH: 'Launch',
}

export default function ProjectActionsClient({ project }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const currentPhaseIndex = PHASE_PROGRESSION.indexOf(project.phase)
  const nextPhase = PHASE_PROGRESSION[currentPhaseIndex + 1]

  async function updateProject(data: Record<string, unknown>) {
    setLoading(true)
    setOpen(false)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      toast.error('Update failed')
    } else {
      toast.success('Project updated')
      router.refresh()
    }
    setLoading(false)
  }

  const transitions = STATUS_TRANSITIONS[project.status] || []

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
      <Link
        href={`/pm/projects/${project.id}/updates/new`}
        className="btn btn-secondary btn-sm"
      >
        Post update
      </Link>

      <div style={{ position: 'relative' }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ gap: '4px' }}
          onClick={() => setOpen(!open)}
          disabled={loading}
        >
          <Settings size={14} />
          Actions
          <ChevronDown size={12} />
        </button>

        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9 }}
              onClick={() => setOpen(false)}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 10,
              minWidth: '220px',
              overflow: 'hidden',
              animation: 'animateIn 0.15s ease-out',
            }}>
              {/* Status transitions */}
              {transitions.length > 0 && (
                <>
                  <div style={{ padding: '8px 12px 4px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Status
                  </div>
                  {transitions.map(t => (
                    <button
                      key={t.next}
                      onClick={() => updateProject({ status: t.next })}
                      style={{
                        display: 'flex', gap: '10px', alignItems: 'center',
                        width: '100%', padding: '10px 14px',
                        fontSize: '13px', color: 'var(--text)',
                        background: 'transparent', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <t.icon size={13} />
                      {t.label}
                    </button>
                  ))}
                </>
              )}

              {/* Phase progression */}
              {nextPhase && (
                <>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <div style={{ padding: '8px 12px 4px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Phase
                  </div>
                  <button
                    onClick={() => updateProject({ phase: nextPhase })}
                    style={{
                      display: 'flex', gap: '10px', alignItems: 'center',
                      width: '100%', padding: '10px 14px',
                      fontSize: '13px', color: 'var(--text)',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <Play size={13} />
                    Move to {PHASE_LABELS[nextPhase]}
                  </button>
                </>
              )}

              {/* Timeline pause/resume */}
              {project.status === 'ACTIVE' && (
                <>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <button
                    onClick={() => updateProject({
                      timelinePaused: !project.timelinePaused,
                      timelinePauseReason: project.timelinePaused ? null : 'Manually paused by PM',
                    })}
                    style={{
                      display: 'flex', gap: '10px', alignItems: 'center',
                      width: '100%', padding: '10px 14px',
                      fontSize: '13px',
                      color: project.timelinePaused ? 'var(--green)' : 'var(--amber)',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {project.timelinePaused ? <Play size={13} /> : <Pause size={13} />}
                    {project.timelinePaused ? 'Resume timeline' : 'Pause timeline'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
