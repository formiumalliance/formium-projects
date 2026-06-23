'use client'
// app/(auth)/forgot-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text)' }}>Formium</span>
          <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '22px' }}>·</span>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '100%',
              background: 'var(--green-bg)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <Mail size={22} color="var(--green)" />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px', marginBottom: '8px' }}>
              Check your email
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              If an account exists for <strong>{email}</strong>, you will receive a password
              reset link within a few minutes. Check your spam folder if you do not see it.
            </p>
            <Link href="/login" className="btn btn-secondary" style={{ display: 'inline-flex', gap: '6px' }}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.4px', marginBottom: '6px' }}>
              Reset your password
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.5 }}>
              Enter your email and we will send you a reset link.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Email address</label>
                <input
                  className="input" type="email"
                  placeholder="you@formiumalliance.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required autoFocus autoComplete="email"
                />
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', height: '44px', marginTop: '4px' }} disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link href="/login"
                style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
