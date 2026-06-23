'use client'
// app/(dashboard)/super-admin/templates/SuperAdminTemplatesClient.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, Sparkles, ToggleLeft, ToggleRight, Info } from 'lucide-react'

const PROJECT_TYPE_LABELS: Record<string, string> = {
  BUSINESS_WEBSITE:  'Business Website',
  ECOMMERCE_WEBSITE: 'E-commerce Website',
  PORTFOLIO_WEBSITE: 'Portfolio Website',
  CATALOGUE_WEBSITE: 'Catalogue Website',
  MOBILE_APP:        'Mobile App',
  SAAS:              'SaaS Platform',
  CRM:               'CRM System',
  ERP:               'ERP System',
  CUSTOM_PRODUCT:    'Custom Product',
}

interface Template {
  id: string
  name: string
  type: string
  description?: string | null
  isActive: boolean
  _count: { tasks: number; folders: number; requirements: number; milestones: number }
}

export default function SuperAdminTemplatesClient({ templates: initial }: { templates: Template[] }) {
  const [templates, setTemplates] = useState(initial)
  const [toggling, setToggling] = useState<string | null>(null)

  async function toggleActive(id: string, current: boolean) {
    setToggling(id)
    const res = await fetch(`/api/admin/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !current } : t))
      toast.success(current ? 'Template disabled' : 'Template enabled')
    }
    setToggling(null)
  }

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>Templates</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Templates auto-generate tasks, folders, requirements and milestones when a new project is created.
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        display: 'flex', gap: '10px', padding: '14px 16px',
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <Info size={15} color="var(--text-tertiary)" style={{ marginTop: '1px', flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>How templates work:</strong> When a PM creates a project with
          "Auto-generate from template" enabled, the system uses <code style={{ fontFamily: 'monospace', fontSize: '11px', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: '4px' }}>lib/templates/engine.ts</code> to
          resolve the correct template by project type and create all tasks, folders, requirements and milestones.
          Templates defined in code take precedence over database templates. Database templates (shown below)
          are saved copies that can be toggled on/off. To add new templates, edit the engine file.
        </div>
      </div>

      {/* Built-in templates from engine (always available) */}
      <div className="card">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
          <Sparkles size={15} color="var(--accent)" />
          <h2 style={{ fontSize: '14px', fontWeight: '600' }}>Built-in templates (always active)</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          {Object.entries(PROJECT_TYPE_LABELS).map(([type, label]) => (
            <div
              key={type}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '3px' }}>{label}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Auto-configured</p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom DB templates */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>
          Saved custom templates ({templates.length})
        </h2>

        {templates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <FileText size={28} color="var(--text-tertiary)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              No custom templates saved yet.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              Custom templates can be created programmatically via the seed file or Prisma Studio.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {templates.map(template => (
              <div key={template.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
                        {template.name}
                      </p>
                      <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                        {PROJECT_TYPE_LABELS[template.type] || template.type}
                      </span>
                      {!template.isActive && (
                        <span className="badge badge-gray" style={{ fontSize: '11px' }}>Disabled</span>
                      )}
                    </div>
                    {template.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {template.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'tasks',        count: template._count.tasks        },
                        { label: 'folders',      count: template._count.folders      },
                        { label: 'requirements', count: template._count.requirements },
                        { label: 'milestones',   count: template._count.milestones   },
                      ].map(item => (
                        <span key={item.label} style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          <strong style={{ color: 'var(--text)', fontWeight: '600' }}>{item.count}</strong> {item.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleActive(template.id, template.isActive)}
                    disabled={toggling === template.id}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: template.isActive ? 'var(--green)' : 'var(--text-tertiary)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '13px', fontWeight: '500', flexShrink: 0,
                      padding: '4px 0',
                    }}
                  >
                    {template.isActive
                      ? <><ToggleRight size={22} /> Active</>
                      : <><ToggleLeft size={22} /> Inactive</>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
