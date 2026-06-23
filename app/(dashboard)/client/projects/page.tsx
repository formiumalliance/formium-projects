// app/(dashboard)/client/projects/page.tsx
import { requireClientRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { HealthBadge } from '@/components/projects/HealthBadge'
import { formatDate } from '@/lib/utils'
import { FolderKanban } from 'lucide-react'

const CLIENT_PHASE_LABELS: Record<string, string> = {
  REQUIREMENTS_COLLECTION: 'Requirements',
  PLANNING: 'Planning',
  BUILDING: 'Building',
  REVIEW_FEEDBACK: 'Review & Feedback',
  LAUNCH: 'Launch',
}

export default async function ClientProjectsPage() {
  const session = await requireClientRole()

  const projects = await prisma.project.findMany({
    where: { clientProfile: { userId: session.user.id }, isArchived: false },
    include: {
      projectManager: { select: { name: true } },
      _count: { select: { updates: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>My Projects</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <FolderKanban size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No projects yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Projects appear here once set up by the Formium team.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {projects.map(project => (
            <Link key={project.id} href={`/client`} className="card"
              style={{ textDecoration: 'none', display: 'block' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px' }}>
                    <HealthBadge health={project.health} />
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '100px' }}>
                      {CLIENT_PHASE_LABELS[project.phase] || project.phase}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>{project.name}</h2>
                  {project.projectManager && (
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                      PM: {project.projectManager.name}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', lineHeight: 1 }}>{project.progress}%</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>complete</p>
                </div>
              </div>
              <div className="progress-bar" style={{ marginBottom: '12px', height: '5px' }}>
                <div className="progress-fill" style={{ width: `${project.progress}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                <span>{project.startDate && `Started ${formatDate(project.startDate)}`}</span>
                {project._count.updates > 0 && (
                  <span style={{ color: 'var(--accent)', fontWeight: '500' }}>
                    {project._count.updates} update{project._count.updates !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
