'use client'
// app/(auth)/login/page.tsx
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (res?.error) {
      toast.error(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error)
      setLoading(false)
      return
    }

    // Fetch session to get role and redirect
    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const role = session?.user?.role

    const roleRoutes: Record<string, string> = {
      SUPER_ADMIN: '/super-admin',
      PROJECT_HEAD: '/project-head',
      PROJECT_MANAGER: '/pm',
      BUSINESS_GROWTH_MANAGER: '/bgm',
      DEVELOPER: '/dev',
      CLIENT_ADMIN: '/client',
      CLIENT_MEMBER: '/client',
    }

    router.push(roleRoutes[role] || '/pm')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
              color: 'var(--text)',
            }}>
              Formium
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '22px' }}>
              ·
            </span>
          </div>
          <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-tertiary)' }}>
            Project delivery platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="input-label">Email address</label>
            <input
              className="input"
              type="email"
              placeholder="you@formiumalliance.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>Password</label>
              <a
                href="/forgot-password"
                style={{ fontSize: '13px', color: 'var(--accent)' }}
              >
                Forgot?
              </a>
            </div>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '6px', width: '100%', height: '44px' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          lineHeight: '1.5',
        }}>
          Formium Alliance LLP · Internal Platform<br />
          Unauthorised access is prohibited.
        </p>
      </div>
    </div>
  )
}
