// app/(dashboard)/super-admin/documents/page.tsx
import { requireAdminRole } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { formatDate } from '@/lib/utils'
import { FileText, Download, Eye } from 'lucide-react'
import Link from 'next/link'

const DOC_TYPE_CONFIG: Record<string, { label: string; cls: string; emoji: string }> = {
  PROPOSAL:       { label: 'Proposal',        cls: 'badge-blue',   emoji: '📋' },
  AGREEMENT:      { label: 'Agreement',        cls: 'badge-green',  emoji: '📑' },
  INVOICE:        { label: 'Invoice',          cls: 'badge-amber',  emoji: '💰' },
  RECEIPT:        { label: 'Receipt',          cls: 'badge-green',  emoji: '🧾' },
  HANDOVER:       { label: 'Handover Doc',     cls: 'badge-accent', emoji: '📦' },
  REQUIREMENT:    { label: 'Requirement',      cls: 'badge-blue',   emoji: '📝' },
  CHANGE_REQUEST: { label: 'Change Request',   cls: 'badge-red',    emoji: '🔄' },
  OTHER:          { label: 'Other',            cls: 'badge-gray',   emoji: '📄' },
}

export default async function SuperAdminDocumentsPage({
  searchParams,
}: {
  searchParams: { type?: string; projectId?: string }
}) {
  await requireAdminRole()

  const documents = await prisma.projectDocument.findMany({
    where: {
      isLatest: true,
      ...(searchParams.type      ? { type:      searchParams.type as any }      : {}),
      ...(searchParams.projectId ? { projectId: searchParams.projectId }        : {}),
    },
    include: {
      project:     { select: { id: true, name: true } },
      attachments: { take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const docTypes = Object.keys(DOC_TYPE_CONFIG)

  return (
    <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Documents</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          {documents.length} document{documents.length !== 1 ? 's' : ''} across all projects
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <form style={{ display: 'contents' }}>
          <select
            name="type"
            className="input"
            style={{ width: 'auto', minWidth: '160px' }}
            defaultValue={searchParams.type || ''}
            onChange={e => {
              const url = new URL(window.location.href)
              e.target.value ? url.searchParams.set('type', e.target.value) : url.searchParams.delete('type')
              window.location.href = url.toString()
            }}
          >
            <option value="">All types</option>
            {docTypes.map(t => (
              <option key={t} value={t}>{DOC_TYPE_CONFIG[t].label}</option>
            ))}
          </select>
          <select
            name="projectId"
            className="input"
            style={{ width: 'auto', minWidth: '200px' }}
            defaultValue={searchParams.projectId || ''}
            onChange={e => {
              const url = new URL(window.location.href)
              e.target.value ? url.searchParams.set('projectId', e.target.value) : url.searchParams.delete('projectId')
              window.location.href = url.toString()
            }}
          >
            <option value="">All projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </form>
      </div>

      {/* Type summary badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {docTypes.map(type => {
          const count = documents.filter(d => d.type === type).length
          if (count === 0) return null
          const cfg = DOC_TYPE_CONFIG[type]
          return (
            <Link
              key={type}
              href={`?type=${type}`}
              className={`badge ${searchParams.type === type ? 'badge-accent' : cfg.cls}`}
              style={{ padding: '4px 12px', fontSize: '12px', textDecoration: 'none', cursor: 'pointer' }}
            >
              {cfg.emoji} {cfg.label} ({count})
            </Link>
          )
        })}
      </div>

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <FileText size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No documents yet</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Documents are uploaded via the PM portal or BGM proposals.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {documents.map((doc, i) => {
            const cfg        = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.OTHER
            const attachment = doc.attachments[0]
            return (
              <div
                key={doc.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr auto auto',
                  gap: '14px',
                  alignItems: 'center',
                  padding: '13px 20px',
                  borderBottom: i < documents.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ fontSize: '22px', textAlign: 'center' }}>{cfg.emoji}</span>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                    <p style={{
                      fontSize: '14px', fontWeight: '500', color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {doc.title}
                    </p>
                    <span className={`badge ${cfg.cls}`} style={{ fontSize: '10px', flexShrink: 0 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {doc.project.name}
                    {attachment && ` · ${attachment.originalName}`}
                    {` · ${formatDate(doc.createdAt)}`}
                  </p>
                </div>

                {attachment && (
                  <>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', height: 'auto' }}
                      title="View"
                    >
                      <Eye size={14} />
                    </a>
                    <a
                      href={`/api/files/${attachment.id}/download`}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', height: 'auto' }}
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
