'use client'
// app/(dashboard)/pm/documents/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { FileText, Upload, Download, Eye, ChevronDown } from 'lucide-react'

const DOC_TYPES = [
  { value: 'PROPOSAL',       label: 'Proposal',           cls: 'badge-blue'   },
  { value: 'AGREEMENT',      label: 'Agreement',          cls: 'badge-green'  },
  { value: 'INVOICE',        label: 'Invoice',            cls: 'badge-amber'  },
  { value: 'RECEIPT',        label: 'Receipt',            cls: 'badge-green'  },
  { value: 'HANDOVER',       label: 'Handover Doc',       cls: 'badge-accent' },
  { value: 'REQUIREMENT',    label: 'Requirement',        cls: 'badge-blue'   },
  { value: 'CHANGE_REQUEST', label: 'Change Request Doc', cls: 'badge-red'    },
  { value: 'OTHER',          label: 'Other',              cls: 'badge-gray'   },
]

interface Document {
  id: string
  type: string
  title: string
  isLatest: boolean
  createdAt: string
  projectId: string
  projectName?: string
  attachments: { id: string; originalName: string; size: number; url: string; key: string }[]
}

interface Project {
  id: string
  name: string
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

function UploadModal({
  projects,
  onUploaded,
  onClose,
}: {
  projects: Project[]
  onUploaded: (doc: Document & { projectName: string }) => void
  onClose: () => void
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [docType, setDocType] = useState('PROPOSAL')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((files: File[]) => setFile(files[0] || null), [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  })

  async function upload() {
    if (!file || !projectId || !title || !docType) {
      toast.error('All fields are required')
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', docType)
    fd.append('title', title)

    const res = await fetch(`/api/projects/${projectId}/documents`, {
      method: 'POST',
      body: fd,
    })
    const data = await res.json()
    if (res.ok) {
      const proj = projects.find(p => p.id === projectId)
      onUploaded({ ...data.data, projectName: proj?.name || '' })
      toast.success('Document uploaded')
      onClose()
    } else {
      toast.error(data.error || 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', backdropFilter: 'blur(4px)',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '24px', animation: 'animateIn 0.2s ease-out' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Upload document</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Project</label>
            <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Document type</label>
            <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Title</label>
            <input className="input" placeholder="e.g. Project Proposal v1 — Sunrise Interiors" value={title}
              onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="input-label">File</label>
            <div {...getRootProps()} style={{
              border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center',
              cursor: 'pointer', background: isDragActive ? 'var(--accent-muted)' : 'var(--bg-secondary)',
              transition: 'all 0.15s',
            }}>
              <input {...getInputProps()} />
              {file ? (
                <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>
                  📄 {file.name} ({formatBytes(file.size)})
                </p>
              ) : (
                <>
                  <Upload size={18} color="var(--text-tertiary)" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {isDragActive ? 'Drop file here' : 'Drop or click to upload'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '3px' }}>PDF, DOCX, XLSX, PNG — max 50 MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={upload} disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload document'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PMDocumentsPage() {
  const [documents, setDocuments] = useState<(Document & { projectName: string })[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterProject, setFilterProject] = useState('')

  useEffect(() => {
    // Load all projects, then all their documents
    fetch('/api/projects?pageSize=100')
      .then(r => r.json())
      .then(async data => {
        const projs: Project[] = data.data || []
        setProjects(projs)

        const allDocs: (Document & { projectName: string })[] = []
        await Promise.all(
          projs.map(async p => {
            const res = await fetch(`/api/projects/${p.id}/documents`)
            const d = await res.json()
            ;(d.data || []).forEach((doc: Document) => {
              allDocs.push({ ...doc, projectId: p.id, projectName: p.name })
            })
          })
        )
        allDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setDocuments(allDocs)
        setLoading(false)
      })
  }, [])

  const filtered = documents.filter(d =>
    (!filterType || d.type === filterType) &&
    (!filterProject || d.projectId === filterProject)
  )

  const typeConfig = (type: string) => DOC_TYPES.find(t => t.value === type) || DOC_TYPES[DOC_TYPES.length - 1]

  return (
    <div style={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Documents</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Proposals, agreements, invoices and handover documents
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)} style={{ gap: '6px' }}>
          <Upload size={15} /> Upload
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto', minWidth: '160px' }}
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: '180px' }}
          value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Documents list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <FileText size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No documents</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Upload proposals, agreements, and invoices.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((doc, i) => {
            const cfg = typeConfig(doc.type)
            const attachment = doc.attachments[0]
            return (
              <div
                key={doc.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ fontSize: '20px', flexShrink: 0 }}>
                  {doc.type === 'INVOICE' || doc.type === 'RECEIPT' ? '💰'
                    : doc.type === 'AGREEMENT' ? '📑'
                    : doc.type === 'PROPOSAL' ? '📋'
                    : doc.type === 'HANDOVER' ? '📦'
                    : '📄'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </p>
                    <span className={`badge ${cfg.cls}`} style={{ flexShrink: 0, fontSize: '11px' }}>{cfg.label}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {doc.projectName}
                    {attachment && ` · ${attachment.originalName} · ${formatBytes(attachment.size)}`}
                    {` · ${formatDate(doc.createdAt)}`}
                  </p>
                </div>
                {attachment && (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showUpload && (
        <UploadModal
          projects={projects}
          onUploaded={doc => setDocuments(prev => [doc, ...prev])}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
