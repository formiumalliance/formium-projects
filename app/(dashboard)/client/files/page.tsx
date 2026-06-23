'use client'
// app/(dashboard)/client/files/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Folder, Upload, File, Lock, Trash2, Download, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ProjectFolder {
  id: string
  name: string
  isCore: boolean
  isClientVisible: boolean
  sortOrder: number
  files: FileAttachment[]
}

interface FileAttachment {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const emoji =
    mimeType.startsWith('image/') ? '🖼️' :
    mimeType === 'application/pdf' ? '📄' :
    mimeType.includes('word') ? '📝' :
    mimeType.includes('sheet') || mimeType.includes('excel') ? '📊' :
    mimeType.includes('zip') || mimeType.includes('archive') ? '📦' :
    mimeType.includes('video') ? '🎬' :
    mimeType.includes('audio') ? '🎵' : '📎'
  return <span style={{ fontSize: '18px' }}>{emoji}</span>
}

function UploadZone({
  folderId,
  projectId,
  onUploaded,
}: {
  folderId: string
  projectId: string
  onUploaded: (file: FileAttachment) => void
}) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    for (const file of acceptedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folderId', folderId)

      try {
        const res = await fetch(`/api/projects/${projectId}/files`, {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        onUploaded(data.data)
        toast.success(`${file.name} uploaded`)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
  }, [folderId, projectId, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50 MB
    disabled: uploading,
  })

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '16px',
        textAlign: 'center',
        cursor: uploading ? 'wait' : 'pointer',
        background: isDragActive ? 'var(--accent-muted)' : 'var(--bg-secondary)',
        transition: 'all 0.15s',
      }}
    >
      <input {...getInputProps()} />
      <Upload size={18} color={isDragActive ? 'var(--accent)' : 'var(--text-tertiary)'} style={{ margin: '0 auto 6px' }} />
      <p style={{ fontSize: '13px', color: isDragActive ? 'var(--accent)' : 'var(--text-secondary)' }}>
        {uploading ? 'Uploading…' : isDragActive ? 'Drop to upload' : 'Drop files or click to upload'}
      </p>
      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '3px' }}>Max 50 MB per file</p>
    </div>
  )
}

export default function ClientFilesPage() {
  const [folders, setFolders] = useState<ProjectFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/projects?pageSize=1')
      .then(r => r.json())
      .then(async data => {
        const project = data.data?.[0]
        if (!project) { setLoading(false); return }
        setProjectId(project.id)

        const res = await fetch(`/api/projects/${project.id}/folders`)
        const fData = await res.json()
        const clientFolders = (fData.data || []).filter((f: ProjectFolder) => f.isClientVisible)
        setFolders(clientFolders)

        // Auto-expand first folder
        if (clientFolders.length > 0) {
          setExpandedFolders(new Set([clientFolders[0].id]))
        }
        setLoading(false)
      })
  }, [])

  function toggleFolder(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleUploaded(folderId: string, file: FileAttachment) {
    setFolders(prev => prev.map(f =>
      f.id === folderId ? { ...f, files: [...f.files, file] } : f
    ))
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '800px' }}>
        <div className="skeleton" style={{ height: '36px', width: '160px', marginBottom: '24px' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: '56px', marginBottom: '8px', borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Files</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Upload requirements and access your project files here.
        </p>
      </div>

      {folders.length === 0 ? (
        <div className="empty-state">
          <Folder size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No folders yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {folders.map(folder => {
            const isOpen = expandedFolders.has(folder.id)
            return (
              <div key={folder.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Folder header */}
                <button
                  onClick={() => toggleFolder(folder.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '14px 18px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Folder size={18} color="var(--accent)" fill="var(--accent-muted)" />
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                    {folder.name}
                  </span>
                  {folder.isCore && (
                    <span title="Core folder — cannot be renamed or deleted">
                      <Lock size={12} color="var(--text-tertiary)" />
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {folder.files?.length || 0} file{(folder.files?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Folder contents */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Upload zone */}
                    {projectId && (
                      <UploadZone
                        folderId={folder.id}
                        projectId={projectId}
                        onUploaded={(file) => handleUploaded(folder.id, file)}
                      />
                    )}

                    {/* Files list */}
                    {folder.files?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {folder.files.map((file, i) => (
                          <div
                            key={file.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius)',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            <FileIcon mimeType={file.mimeType} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.originalName}
                              </p>
                              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {formatBytes(file.size)} · {formatDate(file.createdAt)}
                              </p>
                            </div>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '6px', height: 'auto' }}
                              title="View file"
                            >
                              <Eye size={14} />
                            </a>
                            <a
                              href={`/api/files/${file.id}/download`}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '6px', height: 'auto' }}
                              title="Download"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                        No files yet — upload above
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
