'use client'
// app/(dashboard)/super-admin/documents/DocumentFilters.tsx

interface Project {
  id: string
  name: string
}

interface DocTypeConfig {
  label: string
  cls: string
  emoji: string
}

interface Props {
  docTypes: string[]
  docTypeConfig: Record<string, DocTypeConfig>
  projects: Project[]
  currentType?: string
  currentProjectId?: string
}

export default function DocumentFilters({
  docTypes,
  docTypeConfig,
  projects,
  currentType,
  currentProjectId,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <select
        name="type"
        className="input"
        style={{ width: 'auto', minWidth: '160px' }}
        defaultValue={currentType || ''}
        onChange={e => {
          const url = new URL(window.location.href)
          e.target.value
            ? url.searchParams.set('type', e.target.value)
            : url.searchParams.delete('type')
          window.location.href = url.toString()
        }}
      >
        <option value="">All types</option>
        {docTypes.map(t => (
          <option key={t} value={t}>{docTypeConfig[t].label}</option>
        ))}
      </select>

      <select
        name="projectId"
        className="input"
        style={{ width: 'auto', minWidth: '200px' }}
        defaultValue={currentProjectId || ''}
        onChange={e => {
          const url = new URL(window.location.href)
          e.target.value
            ? url.searchParams.set('projectId', e.target.value)
            : url.searchParams.delete('projectId')
          window.location.href = url.toString()
        }}
      >
        <option value="">All projects</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  )
}
