'use client'
// app/(dashboard)/client/ClientDashboardClient.tsx
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getTreeConfig, CLIENT_PHASE_LABELS, PROJECT_TYPE_LABELS } from '@/types'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { HealthBadge, PhaseBadge } from '@/components/projects/HealthBadge'
import { MessageSquare, FileText, GitBranch, ChevronRight, Clock, CheckCircle2, Circle } from 'lucide-react'

// Lazy load Three.js tree
const GrowthTree = dynamic(() => import('@/components/growth-tree/GrowthTree'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '320px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-tertiary)',
      fontSize: '14px',
    }}>
      Loading tree…
    </div>
  ),
})

interface Props {
  projects: any[]
  activeProject: any | null
  userName: string
}

export default function ClientDashboardClient({ projects, activeProject, userName }: Props) {
  if (!activeProject) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <p style={{ fontSize: '24px' }}>🌱</p>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>No projects yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Your project will appear here once it's set up by the Formium team.
        </p>
      </div>
    )
  }

  const treeConfig = getTreeConfig(activeProject.progress, activeProject.health)
  const completedMilestones = activeProject.milestones.filter((m: any) => m.isCompleted)
  const pendingRequirements = activeProject.requirements.filter((r: any) => !r.isReceived)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Welcome */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text)' }}>
          Welcome back, {userName.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '15px' }}>
          Here's how your project is progressing.
        </p>
      </div>

      {/* Main grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '20px',
        alignItems: 'start',
      }}
      className="max-lg:grid-cols-1"
      >
        {/* Left: Project overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Project card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                    {PROJECT_TYPE_LABELS[activeProject.type] || activeProject.type}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>
                  {activeProject.name}
                </h2>
              </div>
              <HealthBadge health={activeProject.health} />
            </div>

            {/* Phase */}
            <div style={{
              display: 'flex',
              gap: '0',
              marginBottom: '24px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}>
              {(['REQUIREMENTS_COLLECTION', 'PLANNING', 'BUILDING', 'REVIEW_FEEDBACK', 'LAUNCH'] as const).map((phase, i) => {
                const phases = ['REQUIREMENTS_COLLECTION', 'PLANNING', 'BUILDING', 'REVIEW_FEEDBACK', 'LAUNCH']
                const currentIndex = phases.indexOf(activeProject.phase)
                const phaseIndex = phases.indexOf(phase)
                const isDone = phaseIndex < currentIndex
                const isCurrent = phase === activeProject.phase

                return (
                  <div key={phase} style={{ display: 'flex', alignItems: 'center', flex: '1 1 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '60px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '100%',
                        background: isDone ? 'var(--green)' : isCurrent ? 'var(--accent)' : 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${isDone ? 'var(--green)' : isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                        transition: 'all 0.3s',
                        flexShrink: 0,
                      }}>
                        {isDone ? (
                          <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />
                        ) : isCurrent ? (
                          <div style={{ width: '8px', height: '8px', borderRadius: '100%', background: '#fff' }} />
                        ) : (
                          <div style={{ width: '6px', height: '6px', borderRadius: '100%', background: 'var(--border-strong)' }} />
                        )}
                      </div>
                      <p style={{
                        fontSize: '10px',
                        fontWeight: isCurrent ? '600' : '400',
                        color: isCurrent ? 'var(--text)' : isDone ? 'var(--green)' : 'var(--text-tertiary)',
                        marginTop: '5px',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                      }}>
                        {CLIENT_PHASE_LABELS[phase]}
                      </p>
                    </div>
                    {i < 4 && (
                      <div style={{
                        height: '2px',
                        flex: '0 0 16px',
                        background: phaseIndex < currentIndex ? 'var(--green)' : 'var(--border)',
                        marginTop: '-18px',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Overall progress</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                  {activeProject.progress}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${activeProject.progress}%` }}
                />
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {activeProject.startDate && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Started</p>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                    {formatDate(activeProject.startDate)}
                  </p>
                </div>
              )}
              {activeProject.expectedEndDate && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Expected completion</p>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                    {formatDate(activeProject.expectedEndDate)}
                  </p>
                </div>
              )}
              {activeProject.projectManager && (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Project Manager</p>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                    {activeProject.projectManager.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pending requirements */}
          {pendingRequirements.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--amber)', background: 'var(--amber-bg)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '18px' }}>⏳</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                    {pendingRequirements.length} item{pendingRequirements.length > 1 ? 's' : ''} needed from you
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Please upload these to keep your project on schedule.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pendingRequirements.slice(0, 3).map((req: any) => (
                      <div key={req.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Circle size={12} color="var(--amber)" strokeWidth={2} />
                        <span style={{ fontSize: '13px', color: 'var(--text)' }}>{req.title}</span>
                      </div>
                    ))}
                    {pendingRequirements.length > 3 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', paddingLeft: '20px' }}>
                        +{pendingRequirements.length - 3} more
                      </p>
                    )}
                  </div>
                  <Link href={`/client/files`} className="btn btn-secondary btn-sm" style={{ marginTop: '12px', display: 'inline-flex' }}>
                    Upload files →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent updates */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Recent updates</h3>
              <Link href="/client/updates" style={{ fontSize: '13px', color: 'var(--accent)' }}>
                View all →
              </Link>
            </div>

            {activeProject.updates.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>
                No updates yet. Check back soon.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {activeProject.updates.map((update: any, i: number) => (
                  <Link
                    key={update.id}
                    href={`/client/updates/${update.id}`}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      padding: '12px 0',
                      borderBottom: i < activeProject.updates.length - 1 ? '1px solid var(--border)' : 'none',
                      textDecoration: 'none',
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
                      fontSize: '14px',
                      flexShrink: 0,
                    }}>
                      📢
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text)',
                        marginBottom: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {update.title}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {update.publishedBy?.name} · {update.publishedAt ? formatRelativeTime(update.publishedAt) : ''}
                        {update._count.comments > 0 && ` · ${update._count.comments} comment${update._count.comments > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <ChevronRight size={14} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Milestones */}
          {activeProject.milestones.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Milestones</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeProject.milestones.map((ms: any) => (
                  <div key={ms.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '100%',
                      background: ms.isCompleted ? 'var(--green)' : 'var(--bg-tertiary)',
                      border: `2px solid ${ms.isCompleted ? 'var(--green)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {ms.isCompleted && <CheckCircle2 size={12} color="#fff" strokeWidth={2.5} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: ms.isCompleted ? 'var(--text-tertiary)' : 'var(--text)',
                        textDecoration: ms.isCompleted ? 'line-through' : 'none',
                      }}>
                        {ms.title}
                      </p>
                      {ms.dueDate && !ms.isCompleted && (
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          Due {formatDate(ms.dueDate)}
                        </p>
                      )}
                    </div>
                    {ms.isCompleted && ms.completedAt && (
                      <span style={{ fontSize: '11px', color: 'var(--green)' }}>
                        ✓ {formatDate(ms.completedAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Growth Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>
                Your project's growth
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Tap and drag to explore
              </p>
            </div>
            <GrowthTree config={treeConfig} interactive />
          </div>

          {/* Quick actions */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>
              Quick actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { label: 'Leave feedback', href: '/client/updates', icon: MessageSquare },
                { label: 'Upload files', href: '/client/files', icon: FileText },
                { label: 'Request a change', href: '/client/change-requests', icon: GitBranch },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                  }}
                >
                  <action.icon size={15} strokeWidth={1.75} />
                  {action.label}
                  <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
