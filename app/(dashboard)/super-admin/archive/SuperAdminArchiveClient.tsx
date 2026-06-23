'use client'
// app/(dashboard)/super-admin/archive/SuperAdminArchiveClient.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Archive, RotateCcw, AlertTriangle } from 'lucide-react'

const PROJECT_TYPE_LABELS: Record<string, string> = {
  BUSINESS_WEBSITE:   'Business Website',
  ECOMMERCE_WEBSITE:  'E-commerce Website',
  PORTFOLIO_WEBSITE:  'Portfolio Website',
  CATALOGUE_WEBSITE:  'Catalogue Website',
  MOBILE_APP:         'Mobile App',
  SAAS:               'SaaS Platform',
  CRM:                'CRM',
  ERP:                'ERP',
  CUSTOM_PRODUCT:     'Custom Product',
}

interface Project {
  id: string
  name: string
  type: string
  status: string
  progress: number
  archivedAt?: Date | string | null
  startDate?: Date | string | null
  actualEndDate?: Date | string | null
  agreedBudget?: number | null
  currency: string
  projectManager?: { name: string } | null
  clientProfile?: { user: { name: string } } | null
  _count: { tasks: number; documents: number }
}

export default function SuperAdminArchiveClient({ projects: initial }: { projects: Project[] }) {
  const [projects, setProjects] = useState(initial)
  const [restoring, setRestoring] = useState<string | null>(null)

  async function restore(projectId: string) {
    setRestoring(projectId)
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: false, status: 'ACTIVE' }),
    })
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== projectId))
      toast.success('Project restored to Active')
    } else {
      toast.error('Failed to restore project')
    }
    setRestoring(null)
  }

  return (
    <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Archive size={20} color="var(--text-secondary)" />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Archive</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            {projects.length} archived project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: '10px', alignItems: 'flex-start',
        padding: '12px 16px', background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
      }}>
        <AlertTriangle size={14} color="var(--text-tertiary)" style={{ marginTop: '1px', flexShrink: 0 }} />
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Projects are automatically archived 90 days after completion. Archived projects retain
          all agreements, invoices, credentials, activity logs and project history. You can restore
          any project to Active status if needed.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <Archive size={32} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No archived projects</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Completed projects are archived automatically after 90 days.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {projects.map((project, i) => (
            <div
              key={project.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '16px',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: i < projects.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                  </p>
                  <span className="badge badge-gray" style={{ fontSize: '11px', flexShrink: 0 }}>
                    {PROJECT_TYPE_LABELS[project.type] || project.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {project.clientProfile?.user?.name || '—'}
                  </span>
                  {project.projectManager && (
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      PM: {project.projectManager.name}
                    </span>
                  )}
                  {project.agreedBudget && (
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {project.currency} {project.agreedBudget.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {project._count.tasks} tasks · {project._count.documents} docs
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  {project.startDate && `Started ${formatDate(project.startDate as string)}`}
                  {project.actualEndDate && ` · Ended ${formatDate(project.actualEndDate as string)}`}
                  {project.archivedAt && ` · Archived ${formatDate(project.archivedAt as string)}`}
                </p>
              </div>

              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', textAlign: 'right' }}>
                {project.progress}%
              </p>

              <button
                className="btn btn-secondary btn-sm"
                style={{ gap: '5px', flexShrink: 0 }}
                onClick={() => restore(project.id)}
                disabled={restoring === project.id}
              >
                <RotateCcw size={13} />
                {restoring === project.id ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
