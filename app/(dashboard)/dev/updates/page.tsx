// app/(dashboard)/dev/updates/page.tsx
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'
import { PhaseBadge } from '@/components/projects/HealthBadge'

const PHASE_LABELS: Record<string, string> = {
  REQUIREMENTS_COLLECTION: 'Requirements',
  PLANNING:                'Planning',
  BUILDING:                'Building',
  REVIEW_FEEDBACK:         'Review & Feedback',
  LAUNCH:                  'Launch',
}

export default async function DevUpdatesPage() {
  const session = await requireRole([UserRole.DEVELOPER])

  // Find the developer's assigned projects
  const assignments = await prisma.projectDeveloper.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { projectId: true },
  })
  const projectIds = assignments.map(a => a.projectId)

  const updates = await prisma.projectUpdate.findMany({
    where: {
      projectId:   { in: projectIds },
      isPublished: true,
    },
    include: {
      project:     { select: { id: true, name: true } },
      publishedBy: { select: { name: true } },
      _count:      { select: { comments: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 40,
  })

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Project Updates</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Progress updates on your projects
        </p>
      </div>

      {updates.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <MessageSquare size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No updates yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Updates from your Project Manager will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {updates.map(update => (
            <div key={update.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '500',
                  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                  padding: '2px 8px', borderRadius: '100px',
                }}>
                  {update.project.name}
                </span>
                <PhaseBadge phase={update.phase} />
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {update.publishedAt ? formatRelativeTime(update.publishedAt) : ''}
                </span>
              </div>

              <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
                {update.title}
              </p>
              <p style={{
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
                marginBottom: '10px',
              }}>
                {update.content}
              </p>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  by {update.publishedBy.name}
                </span>
                {update._count.comments > 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={11} />
                    {update._count.comments} comment{update._count.comments !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
