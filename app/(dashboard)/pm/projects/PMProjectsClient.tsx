'use client'
// app/(dashboard)/pm/projects/PMProjectsClient.tsx
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { HealthBadge, StatusBadge, PhaseBadge } from '@/components/projects/HealthBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PlusCircle, Search, LayoutGrid, List, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'AWAITING_PAYMENT', label: 'Awaiting Payment' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'REVIEW', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
]

const HEALTH_OPTIONS = [
  { value: '', label: 'All health' },
  { value: 'ON_TRACK', label: 'On Track' },
  { value: 'WAITING_FOR_CLIENT', label: 'Waiting for Client' },
  { value: 'AT_RISK', label: 'At Risk' },
  { value: 'DELAYED', label: 'Delayed' },
]

interface Project {
  id: string
  name: string
  type: string
  status: string
  health: string
  phase: string
  progress: number
  slug: string
  startDate?: Date | null
  expectedEndDate?: Date | null
  agreedBudget?: number | null
  doneTasks: number
  _count: { tasks: number }
  projectManager?: { name: string; avatar?: string | null } | null
  clientProfile?: { user: { name: string } } | null
}

interface Props {
  projects: Project[]
  total: number
  page: number
  pageSize: number
  isAdmin: boolean
}

export default function PMProjectsClient({ projects, total, page, pageSize, isAdmin }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [, startTransition] = useTransition()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilter('search', search)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {total} project{total !== 1 ? 's' : ''}
            {searchParams.get('search') && ` matching "${searchParams.get('search')}"`}
          </p>
        </div>
        {isAdmin && (
          <Link href="projects/new" className="btn btn-primary">
            <PlusCircle size={15} />
            New project
          </Link>
        )}
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </form>

        <select
          className="input"
          style={{ width: 'auto', minWidth: '140px' }}
          value={searchParams.get('status') || ''}
          onChange={e => updateFilter('status', e.target.value)}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          className="input"
          style={{ width: 'auto', minWidth: '160px' }}
          value={searchParams.get('health') || ''}
          onChange={e => updateFilter('health', e.target.value)}
        >
          {HEALTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setViewMode('list')}
            style={{ padding: '6px', height: 'auto' }}
          >
            <List size={15} />
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
            style={{ padding: '6px', height: 'auto' }}
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {/* Projects */}
      {projects.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <Filter size={28} color="var(--text-tertiary)" />
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>No projects found</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Try adjusting your filters or search term.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {projects.map((project, i) => (
            <Link
              key={project.id}
              href={`projects/${project.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto auto',
                gap: '16px',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: i < projects.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {/* Name + client */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '100%', flexShrink: 0,
                    background: {
                      ON_TRACK: 'var(--green)', WAITING_FOR_CLIENT: 'var(--amber)',
                      AT_RISK: 'var(--red)', DELAYED: 'var(--red)',
                    }[project.health] || 'var(--border-strong)',
                  }} />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                  </p>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', paddingLeft: '16px' }}>
                  {project.clientProfile?.user?.name || '—'}
                  {project.projectManager && ` · ${project.projectManager.name}`}
                  {project.expectedEndDate && ` · Due ${formatDate(project.expectedEndDate)}`}
                </p>
              </div>

              {/* Progress */}
              <div style={{ width: '80px', textAlign: 'right' }}>
                <div className="progress-bar" style={{ marginBottom: '3px' }}>
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {project.doneTasks}/{project._count.tasks}
                </p>
              </div>

              <PhaseBadge phase={project.phase} />
              <StatusBadge status={project.status} />

              <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', minWidth: '36px', textAlign: 'right' }}>
                {project.progress}%
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {projects.map(project => (
            <Link
              key={project.id}
              href={`projects/${project.id}`}
              className="card"
              style={{ textDecoration: 'none', display: 'block', transition: 'box-shadow 0.15s, transform 0.15s' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <StatusBadge status={project.status} />
                <HealthBadge health={project.health} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px', lineHeight: 1.3 }}>
                {project.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                {project.clientProfile?.user?.name || '—'}
              </p>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{project.doneTasks}/{project._count.tasks} tasks</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>{project.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <PhaseBadge phase={project.phase} />
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', paddingTop: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            style={{ gap: '4px' }}
          >
            <ChevronLeft size={14} /> Prev
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
            if (p < 1 || p > totalPages) return null
            return (
              <button
                key={p}
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => goToPage(p)}
                style={{ minWidth: '36px', padding: '0' }}
              >
                {p}
              </button>
            )
          })}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            style={{ gap: '4px' }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
