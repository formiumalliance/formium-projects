'use client'
// app/(dashboard)/client/handover/page.tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Package, Download, CheckCircle2, ExternalLink, Lock, Globe, Code } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Handover {
  id: string
  status: string
  liveUrl?: string
  stagingUrl?: string
  repositoryUrl?: string
  deploymentPlatform?: string
  deploymentNotes?: string
  generatedAt?: string
  deliveredAt?: string
  clientAcknowledgedAt?: string
  project: { id: string; name: string }
}

export default function ClientHandoverPage() {
  const [handover, setHandover] = useState<Handover | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState<string>('')
  const [downloading, setDownloading] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)

  useEffect(() => {
    fetch('/api/projects?pageSize=1&status=COMPLETED')
      .then(r => r.json())
      .then(async data => {
        const project = data.data?.[0]
        if (!project) {
          // Try active
          const activeRes = await fetch('/api/projects?pageSize=1')
          const activeData = await activeRes.json()
          const activeProject = activeData.data?.[0]
          if (activeProject) {
            setProjectId(activeProject.id)
            const hRes = await fetch(`/api/projects/${activeProject.id}/handover`)
            const hData = await hRes.json()
            if (hData.data) setHandover({ ...hData.data, project: activeProject })
          }
        } else {
          setProjectId(project.id)
          const hRes = await fetch(`/api/projects/${project.id}/handover`)
          const hData = await hRes.json()
          if (hData.data) setHandover({ ...hData.data, project })
        }
        setLoading(false)
      })
  }, [])

  async function downloadPackage() {
    if (!projectId) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/handover?action=download`, { method: 'PUT' })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${handover?.project?.name || 'project'}-handover.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch {
      toast.error('Failed to download package')
    }
    setDownloading(false)
  }

  async function acknowledge() {
    if (!projectId) return
    setAcknowledging(true)
    const res = await fetch(`/api/projects/${projectId}/handover?action=acknowledge`, { method: 'PUT' })
    if (res.ok) {
      setHandover(h => h ? { ...h, clientAcknowledgedAt: new Date().toISOString(), status: 'DELIVERED' } : h)
      toast.success('Handover acknowledged. Your project is complete!')
    }
    setAcknowledging(false)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '200px' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-xl)' }} />
      </div>
    )
  }

  if (!handover || !['READY', 'DELIVERED'].includes(handover.status)) {
    return (
      <div style={{ maxWidth: '700px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px', marginBottom: '24px' }}>
          Project Handover
        </h1>
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Handover not ready yet
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your project is still in progress. Once your project is completed,
            the Formium team will prepare a handover package with all your assets,
            source code, credentials and deployment details.
          </p>
        </div>
      </div>
    )
  }

  const isAcknowledged = !!handover.clientAcknowledgedAt

  return (
    <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.4px' }}>
          Project Handover
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Your project is complete. Everything you need is here.
        </p>
      </div>

      {/* Status banner */}
      <div style={{
        padding: '16px 20px',
        background: isAcknowledged ? 'var(--green-bg)' : 'var(--accent-muted)',
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${isAcknowledged ? 'rgba(22, 163, 74, 0.2)' : 'rgba(255, 49, 49, 0.2)'}`,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        {isAcknowledged
          ? <CheckCircle2 size={20} color="var(--green)" />
          : <Package size={20} color="var(--accent)" />
        }
        <div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>
            {isAcknowledged
              ? 'Handover complete'
              : 'Your handover package is ready'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isAcknowledged
              ? `Acknowledged on ${formatDate(handover.clientAcknowledgedAt!)}`
              : `Ready since ${handover.generatedAt ? formatDate(handover.generatedAt) : 'now'}`}
          </p>
        </div>
      </div>

      {/* Live URLs */}
      {(handover.liveUrl || handover.stagingUrl) && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600' }}>Your live project</h2>
          {handover.liveUrl && (
            <a
              href={handover.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                padding: '14px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'}
            >
              <Globe size={18} color="var(--green)" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>Live website</p>
                <p style={{ fontSize: '13px', color: 'var(--accent)' }}>{handover.liveUrl}</p>
              </div>
              <ExternalLink size={14} color="var(--text-tertiary)" />
            </a>
          )}
          {handover.stagingUrl && (
            <a
              href={handover.stagingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', gap: '12px', alignItems: 'center',
                padding: '14px 16px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)', textDecoration: 'none',
              }}
            >
              <Code size={18} color="var(--blue)" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>Staging / preview</p>
                <p style={{ fontSize: '13px', color: 'var(--accent)' }}>{handover.stagingUrl}</p>
              </div>
              <ExternalLink size={14} color="var(--text-tertiary)" />
            </a>
          )}
        </div>
      )}

      {/* Download package */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Handover package</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            A ZIP file containing all your project deliverables:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
            {[
              '📁 All brand assets and design files',
              '💻 Source code and repository access',
              '🔑 Login credentials and API keys',
              '🚀 Deployment and hosting instructions',
              '📄 Agreements, invoices and signed documents',
              '📋 Task completion and milestone records',
            ].map(item => (
              <p key={item} style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item}</p>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={downloadPackage}
          disabled={downloading}
          style={{ alignSelf: 'flex-start', gap: '8px' }}
        >
          <Download size={16} />
          {downloading ? 'Preparing download…' : 'Download handover package'}
        </button>
      </div>

      {/* Acknowledge */}
      {!isAcknowledged && (
        <div className="card" style={{ background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Acknowledge receipt</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Once you've reviewed and downloaded your handover package, please acknowledge receipt
            to formally mark the project as complete.
          </p>
          <button
            className="btn btn-primary"
            onClick={acknowledge}
            disabled={acknowledging}
            style={{ gap: '8px' }}
          >
            <CheckCircle2 size={16} />
            {acknowledging ? 'Processing…' : 'Acknowledge & complete project'}
          </button>
        </div>
      )}

      {/* Contact */}
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Questions about your handover? Contact us at{' '}
          <a href="mailto:projects@formiumalliance.com" style={{ color: 'var(--accent)' }}>
            projects@formiumalliance.com
          </a>
        </p>
      </div>
    </div>
  )
}
